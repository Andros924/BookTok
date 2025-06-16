import axios from 'axios';

// Open Library API per cercare libri
export const searchBookByISBN = async (isbn) => {
  try {
    const response = await axios.get(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
    const bookKey = `ISBN:${isbn}`;
    const bookData = response.data[bookKey];

    if (!bookData) {
      throw new Error('Libro non trovato');
    }

    return {
      title: bookData.title || '',
      author: bookData.authors ? bookData.authors.map(a => a.name).join(', ') : '',
      isbn: isbn,
      year: bookData.publish_date ? new Date(bookData.publish_date).getFullYear() : null,
      description: bookData.notes || '',
      cover_image: bookData.cover ? bookData.cover.large || bookData.cover.medium || bookData.cover.small : '',
      pages: bookData.number_of_pages || null,
      language: 'Italiano',
      publisher: bookData.publishers ? bookData.publishers.map(p => p.name).join(', ') : '',
      genre: bookData.subjects ? bookData.subjects.slice(0, 3).map(s => s.name).join(', ') : ''
    };
  } catch (error) {
    // Fallback to Google Books API
    try {
      const googleResponse = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
      const items = googleResponse.data.items;

      if (!items || items.length === 0) {
        throw new Error('Libro non trovato');
      }

      const book = items[0].volumeInfo;
      return {
        title: book.title || '',
        author: book.authors ? book.authors.join(', ') : '',
        isbn: isbn,
        year: book.publishedDate ? new Date(book.publishedDate).getFullYear() : null,
        description: book.description || '',
        cover_image: book.imageLinks ? book.imageLinks.thumbnail || book.imageLinks.smallThumbnail : '',
        pages: book.pageCount || null,
        language: book.language === 'it' ? 'Italiano' : 'Inglese',
        publisher: book.publisher || '',
        genre: book.categories ? book.categories.join(', ') : ''
      };
    } catch (googleError) {
      throw new Error('Libro non trovato in nessuna API');
    }
  }
};

export const searchBooksByTitle = async (title) => {
  try {
    const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(title)}&maxResults=10`);
    const items = response.data.items || [];

    return items.map(item => {
      const book = item.volumeInfo;
      const isbn = book.industryIdentifiers ? 
        book.industryIdentifiers.find(id => id.type === 'ISBN_13')?.identifier ||
        book.industryIdentifiers.find(id => id.type === 'ISBN_10')?.identifier : '';

      return {
        title: book.title || '',
        author: book.authors ? book.authors.join(', ') : '',
        isbn: isbn,
        year: book.publishedDate ? new Date(book.publishedDate).getFullYear() : null,
        description: book.description || '',
        cover_image: book.imageLinks ? book.imageLinks.thumbnail || book.imageLinks.smallThumbnail : '',
        pages: book.pageCount || null,
        language: book.language === 'it' ? 'Italiano' : 'Inglese',
        publisher: book.publisher || '',
        genre: book.categories ? book.categories.join(', ') : ''
      };
    });
  } catch (error) {
    throw new Error('Errore nella ricerca dei libri');
  }
};