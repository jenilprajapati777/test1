import { describe, it, expect, beforeEach } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import fs from "fs";
import path from "path";

const migrationSql = fs.readFileSync(
  path.resolve(__dirname, "../../supabase/migrations/0001_init.sql"),
  "utf-8",
);

describe("SQL & RLS Security Suite (Tests 15 - 20)", () => {
  let db: PGlite;

  beforeEach(async () => {
    db = new PGlite();
    await db.exec(migrationSql);
  });

  const setUser = async (userId: string | null) => {
    if (userId) {
      await db.exec(
        `SET ROLE authenticated; SET request.jwt.claim.sub = '${userId}';`,
      );
    } else {
      await db.exec(`SET ROLE anon; SET request.jwt.claim.sub = '';`);
    }
  };

  it("Test 20: Idempotent migration check (running migration twice succeeds)", async () => {
    // Re-applying migration on existing database must succeed with 0 errors
    await expect(db.exec(migrationSql)).resolves.not.toThrow();
  });

  it("Test 15: Anon cannot select directly from tables; non-owner cannot read/modify others rows", async () => {
    const ownerId = "11111111-1111-1111-1111-111111111111";
    const otherUserId = "22222222-2222-2222-2222-222222222222";
    const museumId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const slug = "testslug001";

    // 1. Owner inserts museum & artwork
    await setUser(ownerId);
    await db.query(
      `INSERT INTO museums (id, owner_id, slug, status, title, from_name, to_name, plaque_title, plaque_body)
       VALUES ($1, $2, $3, 'published', 'Our Museum', 'Alice', 'Bob', 'For Bob', 'A sweet note');`,
      [museumId, ownerId, slug],
    );

    await db.query(
      `INSERT INTO artworks (museum_id, kind, storage_path, sort_order)
       VALUES ($1, 'photo', 'artworks/1.webp', 0);`,
      [museumId],
    );

    // 2. Anon attempts direct SELECT
    await setUser(null);
    const anonMuseums = await db.query(`SELECT * FROM museums;`);
    expect(anonMuseums.rows.length).toBe(0);

    const anonArtworks = await db.query(`SELECT * FROM artworks;`);
    expect(anonArtworks.rows.length).toBe(0);

    // 3. User B (different user) attempts direct SELECT and UPDATE
    await setUser(otherUserId);
    const userBMuseums = await db.query(`SELECT * FROM museums;`);
    expect(userBMuseums.rows.length).toBe(0);

    const userBUpdate = await db.query(
      `UPDATE museums SET title = 'Hacked' WHERE id = $1;`,
      [museumId],
    );
    expect(userBUpdate.affectedRows).toBe(0);

    // 4. Owner can SELECT their museum
    await setUser(ownerId);
    const ownerMuseums = await db.query(
      `SELECT * FROM museums WHERE id = $1;`,
      [museumId],
    );
    expect(ownerMuseums.rows.length).toBe(1);
    expect((ownerMuseums.rows[0] as any).title).toBe("Our Museum");
  });

  it("Test 16: get_museum(slug) returns public JSON without owner_id; returns NULL for draft/archived/expired", async () => {
    const ownerId = "33333333-3333-3333-3333-333333333333";
    await setUser(ownerId);

    // Published museum
    await db.query(
      `INSERT INTO museums (owner_id, slug, status, title, from_name, to_name, plaque_title, plaque_body)
       VALUES ($1, 'pubslug0001', 'published', 'Summer Trip', 'Ethan', 'Maya', 'For Maya', 'Love you');`,
      [ownerId],
    );

    // Draft museum
    await db.query(
      `INSERT INTO museums (owner_id, slug, status, title, from_name, to_name, plaque_title, plaque_body)
       VALUES ($1, 'draftslug01', 'draft', 'Secret Museum', 'Ethan', 'Maya', 'For Maya', 'WIP');`,
      [ownerId],
    );

    // Archived museum
    await db.query(
      `INSERT INTO museums (owner_id, slug, status, title, from_name, to_name, plaque_title, plaque_body)
       VALUES ($1, 'archslug001', 'archived', 'Old Museum', 'Ethan', 'Maya', 'For Maya', 'Done');`,
      [ownerId],
    );

    // Expired museum
    await db.query(
      `INSERT INTO museums (owner_id, slug, status, title, from_name, to_name, plaque_title, plaque_body, expires_at)
       VALUES ($1, 'expired0001', 'published', 'Expired Museum', 'Ethan', 'Maya', 'For Maya', 'Passed', now() - interval '1 day');`,
      [ownerId],
    );

    // Call as anon
    await setUser(null);

    // Published returns valid JSON
    const resPub = await db.query(`SELECT get_museum('pubslug0001') as data;`);
    const dataPub = (resPub.rows[0] as any).data;
    expect(dataPub).not.toBeNull();
    expect(dataPub.slug).toBe("pubslug0001");
    expect(dataPub.title).toBe("Summer Trip");
    // Owner ID MUST NOT be leaked to public
    expect(dataPub.owner_id).toBeUndefined();

    // Draft returns NULL
    const resDraft = await db.query(
      `SELECT get_museum('draftslug01') as data;`,
    );
    expect((resDraft.rows[0] as any).data).toBeNull();

    // Archived returns NULL
    const resArch = await db.query(`SELECT get_museum('archslug001') as data;`);
    expect((resArch.rows[0] as any).data).toBeNull();

    // Expired returns NULL
    const resExp = await db.query(`SELECT get_museum('expired0001') as data;`);
    expect((resExp.rows[0] as any).data).toBeNull();
  });

  it("Test 17: Owner CRUD and cascading deletion of artworks & replies", async () => {
    const ownerId = "44444444-4444-4444-4444-444444444444";
    const museumId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    await setUser(ownerId);

    // Create
    await db.query(
      `INSERT INTO museums (id, owner_id, slug, status, title, from_name, to_name, plaque_title, plaque_body)
       VALUES ($1, $2, 'crudslug001', 'draft', 'Draft 1', 'Sam', 'Robin', 'For Robin', 'Hello');`,
      [museumId, ownerId],
    );

    await db.query(
      `INSERT INTO artworks (museum_id, kind, storage_path, sort_order)
       VALUES ($1, 'photo', 'artworks/pic.webp', 0);`,
      [museumId],
    );

    await db.query(
      `INSERT INTO replies (museum_id, visitor_name, message)
       VALUES ($1, 'Robin', 'Thank you!');`,
      [museumId],
    );

    // Read
    const checkArt = await db.query(
      `SELECT * FROM artworks WHERE museum_id = $1;`,
      [museumId],
    );
    expect(checkArt.rows.length).toBe(1);

    const checkRep = await db.query(
      `SELECT * FROM replies WHERE museum_id = $1;`,
      [museumId],
    );
    expect(checkRep.rows.length).toBe(1);

    // Update
    await db.query(
      `UPDATE museums SET title = 'Updated Title' WHERE id = $1;`,
      [museumId],
    );
    const updated = await db.query(`SELECT title FROM museums WHERE id = $1;`, [
      museumId,
    ]);
    expect((updated.rows[0] as any).title).toBe("Updated Title");

    // Delete museum
    await db.query(`DELETE FROM museums WHERE id = $1;`, [museumId]);

    // Verify cascade
    const remainingArt = await db.query(
      `SELECT * FROM artworks WHERE museum_id = $1;`,
      [museumId],
    );
    expect(remainingArt.rows.length).toBe(0);

    const remainingRep = await db.query(
      `SELECT * FROM replies WHERE museum_id = $1;`,
      [museumId],
    );
    expect(remainingRep.rows.length).toBe(0);
  });

  it("Test 18: Reject 25th photo, 2nd video, negative dimensions, and length overflow", async () => {
    const ownerId = "55555555-5555-5555-5555-555555555555";
    const museumId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    await setUser(ownerId);

    await db.query(
      `INSERT INTO museums (id, owner_id, slug, status, title, from_name, to_name, plaque_title, plaque_body)
       VALUES ($1, $2, 'limitslug01', 'published', 'Limit Test', 'Alex', 'Taylor', 'For Taylor', 'Body');`,
      [museumId, ownerId],
    );

    // Insert 24 photos
    for (let i = 0; i < 24; i++) {
      await db.query(
        `INSERT INTO artworks (museum_id, kind, storage_path, sort_order)
         VALUES ($1, 'photo', $2, $3);`,
        [museumId, `artworks/${i}.webp`, i],
      );
    }

    // 25th photo must fail
    await expect(
      db.query(
        `INSERT INTO artworks (museum_id, kind, storage_path, sort_order)
         VALUES ($1, 'photo', 'artworks/24.webp', 0);`,
        [museumId],
      ),
    ).rejects.toThrow(/24 photos/);

    // 1st video succeeds
    await db.query(
      `INSERT INTO artworks (museum_id, kind, storage_path, sort_order)
       VALUES ($1, 'video', 'artworks/clip1.mp4', 0);`,
      [museumId],
    );

    // 2nd video must fail
    await expect(
      db.query(
        `INSERT INTO artworks (museum_id, kind, storage_path, sort_order)
         VALUES ($1, 'video', 'artworks/clip2.mp4', 0);`,
        [museumId],
      ),
    ).rejects.toThrow(/1 video/);

    // Negative dimensions must fail CHECK constraint
    await expect(
      db.query(
        `INSERT INTO artworks (museum_id, kind, storage_path, width, height)
         VALUES ($1, 'photo', 'artworks/neg.webp', -100, 200);`,
        [museumId],
      ),
    ).rejects.toThrow();

    // Title overflow > 40 chars must fail CHECK constraint
    await expect(
      db.query(
        `INSERT INTO museums (owner_id, slug, title, from_name, to_name, plaque_title, plaque_body)
         VALUES ($1, 'overslug001', '${"A".repeat(50)}', 'A', 'B', 'C', 'D');`,
        [ownerId],
      ),
    ).rejects.toThrow();
  });

  it("Test 19: Rate limit in post_reply rejects 4th call within 1 minute", async () => {
    const ownerId = "66666666-6666-6666-6666-666666666666";
    const slug = "rateslug001";
    await setUser(ownerId);

    await db.query(
      `INSERT INTO museums (owner_id, slug, status, title, from_name, to_name, plaque_title, plaque_body)
       VALUES ($1, $2, 'published', 'Rate Test', 'Alex', 'Taylor', 'For Taylor', 'Body');`,
      [ownerId, slug],
    );

    // Switch to anon
    await setUser(null);

    // 1st reply succeeds
    const rep1 = await db.query(
      `SELECT post_reply($1, 'Guest', 'Msg 1') as res;`,
      [slug],
    );
    expect((rep1.rows[0] as any).res.success).toBe(true);

    // 2nd reply succeeds
    const rep2 = await db.query(
      `SELECT post_reply($1, 'Guest', 'Msg 2') as res;`,
      [slug],
    );
    expect((rep2.rows[0] as any).res.success).toBe(true);

    // 3rd reply succeeds
    const rep3 = await db.query(
      `SELECT post_reply($1, 'Guest', 'Msg 3') as res;`,
      [slug],
    );
    expect((rep3.rows[0] as any).res.success).toBe(true);

    // 4th reply within same minute must be rejected by rate limiter
    const rep4 = await db.query(
      `SELECT post_reply($1, 'Guest', 'Msg 4') as res;`,
      [slug],
    );
    expect((rep4.rows[0] as any).res.success).toBe(false);
    expect((rep4.rows[0] as any).res.error).toMatch(/Rate limit/);
  });
});
