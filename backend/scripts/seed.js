require('dotenv').config();
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

const sampleMangas = [
  {
    title: "One Piece Vol. 1",
    author: "Eiichiro Oda",
    price: 4990,
    original_price: 5990,
    rating: 4.9,
    genre: "Aventura",
    image: "https://th.bing.com/th/id/R.0e209306480ab59b0d9691964847db27?rik=qnpOEV2pJfThlg&pid=ImgRaw&r=0",
    description: "La historia de Monkey D. Luffy y su búsqueda del tesoro más grande del mundo.",
    stock_quantity: 25,
    is_offer: true
  },
  {
    title: "Naruto Vol. 1",
    author: "Masashi Kishimoto",
    price: 4990,
    rating: 4.8,
    genre: "Acción",
    image: "https://cdn.kobo.com/book-images/e354f3eb-d7f8-4339-9c95-f6b1885bad7d/1200/1200/False/naruto-vol-1.jpg",
    description: "Las aventuras de Naruto Uzumaki, un joven ninja que busca convertirse en Hokage.",
    stock_quantity: 30,
    is_offer: false
  },
  {
    title: "Attack on Titan Vol. 1",
    author: "Hajime Isayama",
    price: 4990,
    original_price: 5990,
    rating: 4.9,
    genre: "Drama",
    image: "https://tse1.mm.bing.net/th/id/OIP.p_2LdP02viw5KSMyJ4OJCQHaK1?rs=1&pid=ImgDetMain&o=7&rm=3",
    description: "La humanidad lucha por sobrevivir contra los titanes gigantes.",
    stock_quantity: 20,
    is_offer: true
  },
  {
    title: "My Hero Academia Vol. 1",
    author: "Kohei Horikoshi",
    price: 4990,
    rating: 4.7,
    genre: "Superhéroes",
    image: "https://th.bing.com/th/id/R.67f3a6a91cd9ad3e329bfc6750f93301?rik=8DoE9srY6SHZng&riu=http%3a%2f%2fwww.manga-sanctuary.com%2fimageslesseries2%2fmy-hero-academia-manga-volume-1-simple-240907.jpg&ehk=1HtPP6GIQynLtrze28qJU%2fZOYDtfi6AjQyrq%2fWHDQ6I%3d&risl=&pid=ImgRaw&r=0",
    description: "En un mundo donde la mayoría tiene superpoderes, Izuku Midoriya sueña con ser un héroe.",
    stock_quantity: 15,
    is_offer: false
  },
  {
    title: "Demon Slayer Vol. 1",
    author: "Koyoharu Gotouge",
    price: 4990,
    original_price: 5990,
    rating: 4.8,
    genre: "Acción",
    image: "https://tse4.mm.bing.net/th/id/OIP.xoQ0toa3bX8umYkYMqZ2SAHaLH?rs=1&pid=ImgDetMain&o=7&rm=3",
    description: "Tanjiro Kamado se convierte en cazador de demonios para salvar a su hermana.",
    stock_quantity: 0,
    is_offer: true
  },
  {
    title: "Death Note Vol. 1",
    author: "Tsugumi Ohba",
    price: 4990,
    rating: 4.9,
    genre: "Thriller",
    image: "https://cdn.aprendejaponeshoy.com/20313-thickbox_default/death-note-vol1-edicin-bunko.jpg",
    description: "Un estudiante encuentra un cuaderno que mata a cualquiera cuyo nombre se escriba en él.",
    stock_quantity: 18,
    is_offer: false
  },
  {
    title: "Dragon Ball Vol. 1",
    author: "Akira Toriyama",
    price: 4990,
    original_price: 5990,
    rating: 4.8,
    genre: "Aventura",
    image: "https://cdn.kobo.com/book-images/e62b2bbd-44ff-457e-9f2f-2d24dc574740/1200/1200/False/dragon-ball-vol-1-sj-edition.jpg",
    description: "Las aventuras de Goku y sus amigos mientras buscan las Dragon Balls.",
    stock_quantity: 22,
    is_offer: true
  },
  {
    title: "Tokyo Ghoul Vol. 1",
    author: "Sui Ishida",
    price: 4990,
    rating: 4.6,
    genre: "Horror",
    image: "https://tse4.mm.bing.net/th/id/OIP.puR-0yoH2KALEttlH4BBswHaKn?rs=1&pid=ImgDetMain&o=7&rm=3",
    description: "Ken Kaneki se convierte en un híbrido humano-ghoul después de un accidente.",
    stock_quantity: 12,
    is_offer: false
  },
  {
    title: "One Punch Man Vol. 1",
    author: "ONE",
    price: 4990,
    rating: 4.8,
    genre: "Acción",
    image: "https://tse4.mm.bing.net/th/id/OIP.FDIGY5BaiJt5GymYknPo4AHaLH?rs=1&pid=ImgDetMain&o=7&rm=3",
    description: "Saitama, un héroe que puede derrotar a cualquier enemigo con un solo golpe.",
    stock_quantity: 28,
    is_offer: false
  },
  {
    title: "Hunter x Hunter Vol. 1",
    author: "Yoshihiro Togashi",
    price: 4990,
    rating: 4.9,
    genre: "Aventura",
    image: "https://cdn.kobo.com/book-images/faad0238-f703-4c9f-9713-9e8fd4c6d236/1200/1200/False/hunter-x-hunter-vol-1.jpg",
    description: "Gon Freecss busca a su padre siguiendo los pasos para convertirse en Hunter.",
    stock_quantity: 16,
    is_offer: false
  }
];

const categories = [
  { name: "Aventura", description: "Mangas de aventuras épicas y viajes" },
  { name: "Acción", description: "Mangas con peleas intensas y acción constante" },
  { name: "Drama", description: "Mangas con historias emocionales y profundas" },
  { name: "Superhéroes", description: "Mangas sobre héroes con superpoderes" },
  { name: "Thriller", description: "Mangas de suspenso y misterio" },
  { name: "Horror", description: "Mangas de terror y sobrenatural" }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Insert categories
    console.log('📚 Inserting categories...');
    for (const category of categories) {
      await pool.execute(
        'INSERT INTO categories (name, description) VALUES (?, ?)',
        [category.name, category.description]
      );
    }

    // Get category IDs
    const [categoryResults] = await pool.execute('SELECT id, name FROM categories');
    const categoryMap = {};
    categoryResults.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });

    // Insert products
    console.log('📖 Inserting manga products...');
    for (const manga of sampleMangas) {
      const categoryId = categoryMap[manga.genre] || null;
      
      await pool.execute(`
        INSERT INTO products (
          title, author, price, original_price, rating, genre, image, 
          description, stock_quantity, is_offer, category_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        manga.title, manga.author, manga.price, manga.original_price || null, 
        manga.rating, manga.genre, manga.image, manga.description, 
        manga.stock_quantity, manga.is_offer, categoryId
      ]);
    }

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 12);
    await pool.execute(`
      INSERT INTO users (username, email, password, full_name, role) 
      VALUES (?, ?, ?, ?, ?)
    `, ['admin', 'admin@mangastore.com', adminPassword, 'Administrator', 'admin']);

    // Create sample regular user
    console.log('👤 Creating sample user...');
    const userPassword = await bcrypt.hash('user123', 12);
    await pool.execute(`
      INSERT INTO users (username, email, password, full_name, role) 
      VALUES (?, ?, ?, ?, ?)
    `, ['user', 'user@mangastore.com', userPassword, 'Test User', 'user']);

    console.log('✅ Database seeding completed successfully!');
    console.log('📋 Sample data:');
    console.log('  - Admin user: admin@mangastore.com / admin123');
    console.log('  - Regular user: user@mangastore.com / user123');
    console.log('  - Manga products: 10 titles');
    console.log('  - Categories: 6 genres');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    throw error;
  }
}

async function main() {
  try {
    await seedDatabase();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding process failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { seedDatabase };