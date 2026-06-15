import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

const PORT = 3000;
const PER_PAGE = 10;

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.set('view engine', 'ejs');

// Головна сторінка
app.get('/', async (req, res, next) => {
  try {
    const {
      search = '',
      sort = 'newest',
      page = '1'
    } = req.query;

    const pageNum = Number(page);

    const where = {};

    if (search.trim()) {
      where.title = {
        contains: search.trim()
      };
    }

    const orderBy = {
      createdAt: sort === 'oldest'
        ? 'asc'
        : 'desc'
    };

    const total =
      await prisma.announcement.count({
        where
      });

    const totalPages =
      Math.ceil(total / PER_PAGE);

    const announcements =
      await prisma.announcement.findMany({
        where,
        orderBy,
        skip: (pageNum - 1) * PER_PAGE,
        take: PER_PAGE
      });

    res.render('index', {
      announcements,
      search,
      sort,
      currentPage: pageNum,
      totalPages
    });
  } catch (error) {
    next(error);
  }
});

// Форма створення
app.get('/announcements', (req, res) => {
  res.render('new', {
    errors: {},
    data: null
  });
});

// Створення
app.post('/announcements', async (req, res, next) => {
  try {
    const {
      title,
      description,
      price,
      category,
      contactInfo
    } = req.body;

    const errors = {};

    if (!title || title.trim().length < 5) {
      errors.title =
        'Назва має бути не менше 5 символів';
    }

    if (
      !description ||
      description.trim().length < 10
    ) {
      errors.description =
        'Опис має бути не менше 10 символів';
    }

    if (
      !contactInfo ||
      contactInfo.trim().length < 5
    ) {
      errors.contactInfo =
        'Контакти мають бути не менше 5 символів';
    }

    const validCategories = [
      'sale',
      'service',
      'job',
      'other'
    ];

    if (
      !validCategories.includes(category)
    ) {
      errors.category =
        'Оберіть категорію';
    }

    if (
      !price ||
      isNaN(price) ||
      Number(price) <= 0
    ) {
      errors.price =
        'Ціна має бути додатним числом';
    }

    if (
      Object.keys(errors).length > 0
    ) {
      return res.render('new', {
        errors,
        data: req.body
      });
    }

    const announcement =
      await prisma.announcement.create({
        data: {
          title: title.trim(),
          description:
            description.trim(),
          contactInfo:
            contactInfo.trim(),
          category,
          price: Number(price)
        }
      });

    res.redirect(
      `/announcements/${announcement.id}`
    );
  } catch (error) {
    next(error);
  }
});

// Перегляд
app.get('/announcements/:id', async (req, res, next) => {
  try {
    const announcement =
      await prisma.announcement.findUnique({
        where: {
          id: Number(req.params.id)
        }
      });

    if (!announcement) {
      return res.status(404).render(
        '404',
        {
          message:
            'Оголошення не знайдено'
        }
      );
    }

    res.render(
      'announcement',
      { announcement }
    );
  } catch (error) {
    next(error);
  }
});

// Видалення
app.delete('/announcements/:id', async (req, res, next) => {
  try {
    await prisma.announcement.delete({
      where: {
        id: Number(req.params.id)
      }
    });

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

// 404
app.use((req, res) => {
  res.status(404).render('404', {
    message:
      'Сторінку не знайдено'
  });
});

// 500
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error');
});

app.listen(PORT, () => {
  console.log(
    `Server started on http://localhost:${PORT}`
  );
});
