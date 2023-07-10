process.env.NODE_ENV = "test"

const request = require("supertest")

const app = require("../app")
const db = require("../db")

let book_isbn;

beforeEach(async () => {
    let result = await db.query(`
    INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year)
    VALUES('234567890', 'https://time.com/time', 'God', 'English', 1000, 'Heaven publishers', 'My Life', 2023) RETURNING isbn`)

    book_isbn = result.rows[0].isbn
})

describe("POST /books", function () {
    test("Creates a new book", async function () {
        const res = await request(app)
        .post('/books')
        .send({isbn: '28749723',
                amazon_url: "https://summer.com",
                author: "dude",
                language: "english",
                pages: 100,
                publisher: "meh",
                title: "late",
                year: 2013 })
        expect(res.statusCode).toBe(201);
        expect(res.body.book).toHaveProperty("isbn")
    })
    test("Creating a book without a title", async function () {
        const res = await request(app)
            .post('/books')
            .send({year: 2003});
        expect(res.statusCode).toBe(400);
    })
})

describe("GET /books/:isbn", function () {
    test("Gets a single book", async function () {
      const response = await request(app)
          .get(`/books/${book_isbn}`)
      expect(response.body.book).toHaveProperty("isbn");
      expect(response.body.book.isbn).toBe(book_isbn);
    });

    test("Responds with 404 if can't find book in question", async function () {
      const response = await request(app)
          .get(`/books/999`)
      expect(response.statusCode).toBe(404);
    });
  });

  describe("PUT /books/:isbn", function () {
    test("Updates a single book", async function () {
      const response = await request(app)
          .put(`/books/${book_isbn}`)
          .send({
            amazon_url: "https://plane.com",
            author: "heat",
            language: "english",
            pages: 1000,
            publisher: "answer",
            title: "When",
            year: 2000
          });
      expect(response.body.book).toHaveProperty("isbn");
      expect(response.body.book.title).toBe("When");
    });

    test("Prevents a bad book update", async function () {
      const response = await request(app)
          .put(`/books/${book_isbn}`)
          .send({
            isbn: "32794782",
            crap: "This is wrong",
            amazon_url: "https://ill.com",
            author: "jimmy",
            language: "english",
            pages: 1000,
            publisher: "yeah right",
            title: "UPDATED BOOK",
            year: 2001
          });
      expect(response.statusCode).toBe(400);
    });

    test("Responds 404 if can't find book in question", async function () {
      await request(app).delete(`/books/${book_isbn}`)
      const response = await request(app).delete(`/books/${book_isbn}`);
      expect(response.statusCode).toBe(404);
    });
  });

describe("DELETE /books/:isbn", function () {
    test("Deletes a single book", async function () {
        const res = await request(app).delete(`/books/${book_isbn}`)
        expect(res.body).toEqual({message: "Book deleted"})
    })
})

afterEach(async function () {
    await db.query("DELETE FROM books")
});

afterAll(async function() {
        await db.end()
})
