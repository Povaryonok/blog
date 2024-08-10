const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');
const session = require('express-session');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

// Регистрация пользователя
app.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    const query = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
    db.run(query, [username, email, password], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Ошибка регистрации пользователя' });
        }
        req.session.userId = this.lastID;
        res.status(200).json({ success: 'Пользователь успешно зарегистрирован' });
    });
});

// Вход пользователя
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const query = `SELECT * FROM users WHERE username = ? AND password = ?`;
    db.get(query, [username, password], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка при попытке входа' });
        }
        if (!row) {
            return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
        }
        req.session.userId = row.id;
        res.status(200).json({ success: 'Вход выполнен успешно' });
    });
});

// Создание поста
app.post('/create-post', (req, res) => {
    const { title, content, tags } = req.body;
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ error: 'Пользователь не авторизован' });
    }

    const query = `INSERT INTO posts (title, content, userId) VALUES (?, ?, ?)`;
    db.run(query, [title, content, userId], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Ошибка создания поста' });
        }

        const postId = this.lastID;
        const tagQueries = tags.map(tag => `INSERT INTO tags (name, postId) VALUES ('${tag}', ${postId})`).join('; ');

        db.exec(tagQueries, function (err) {
            if (err) {
                return res.status(500).json({ error: 'Ошибка добавления тегов' });
            }
            res.status(200).json({ success: 'Пост успешно создан' });
        });
    });
});

// Редактирование поста
app.put('/edit-post/:id', (req, res) => {
    const { id } = req.params;
    const { title, content, tags } = req.body;
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ error: 'Пользователь не авторизован' });
    }

    const query = `UPDATE posts SET title = ?, content = ? WHERE id = ? AND userId = ?`;
    db.run(query, [title, content, id, userId], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Ошибка редактирования поста' });
        }
        if (this.changes === 0) {
            return res.status(403).json({ error: 'У вас нет прав на редактирование этого поста' });
        }

        const deleteTagsQuery = `DELETE FROM tags WHERE postId = ?`;
        db.run(deleteTagsQuery, [id], function (err) {
            if (err) {
                return res.status(500).json({ error: 'Ошибка удаления старых тегов' });
            }

            const tagQueries = tags.map(tag => `INSERT INTO tags (name, postId) VALUES ('${tag}', ${id})`).join('; ');

            db.exec(tagQueries, function (err) {
                if (err) {
                    return res.status(500).json({ error: 'Ошибка добавления тегов' });
                }
                res.status(200).json({ success: 'Пост успешно отредактирован' });
            });
        });
    });
});

// Удаление поста
app.delete('/delete-post/:id', (req, res) => {
    const { id } = req.params;
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ error: 'Пользователь не авторизован' });
    }

    const query = `DELETE FROM posts WHERE id = ? AND userId = ?`;
    db.run(query, [id, userId], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Ошибка удаления поста' });
        }
        if (this.changes === 0) {
            return res.status(403).json({ error: 'У вас нет прав на удаление этого поста' });
        }
        res.status(200).json({ success: 'Пост успешно удален' });
    });
});

// Подписка на пользователя
app.post('/follow', (req, res) => {
    const { userIdToFollow } = req.body;
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ error: 'Пользователь не авторизован' });
    }

    if (userId == userIdToFollow) {
        return res.status(400).json({ error: 'Вы не можете подписаться на самого себя' });
    }

    const query = `INSERT INTO followers (userId, followerId) VALUES (?, ?)`;
    db.run(query, [userIdToFollow, userId], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Ошибка подписки на пользователя' });
        }
        res.status(200).json({ success: 'Подписка успешна' });
    });
});

// Добавление комментария
app.post('/add-comment', (req, res) => {
    const { postId, content } = req.body;
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ error: 'Пользователь не авторизован' });
    }

    const query = `INSERT INTO comments (content, postId, userId) VALUES (?, ?, ?)`;
    db.run(query, [content, postId, userId], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Ошибка добавления комментария' });
        }
        res.status(200).json({ success: 'Комментарий успешно добавлен' });
    });
});

// Получение всех комментариев к посту
app.get('/comments/:postId', (req, res) => {
    const { postId } = req.params;

    const query = `SELECT comments.id, comments.content, users.username 
                   FROM comments 
                   JOIN users ON comments.userId = users.id 
                   WHERE comments.postId = ? 
                   ORDER BY comments.id DESC`;
    db.all(query, [postId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка получения комментариев' });
        }
        res.status(200).json(rows);
    });
});

// Получение всех постов
app.get('/posts', (req, res) => {
    const query = `SELECT posts.id, posts.title, posts.content, users.username, posts.userId
                   FROM posts 
                   JOIN users ON posts.userId = users.id 
                   ORDER BY posts.id DESC`;
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка получения постов' });
        }
        res.status(200).json(rows);
    });
});

// Получение постов текущего пользователя
app.get('/my-posts', (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ error: 'Пользователь не авторизован' });
    }

    const query = `SELECT * FROM posts WHERE userId = ? ORDER BY id DESC`;
    db.all(query, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка получения постов' });
        }
        res.status(200).json(rows);
    });
});

// Получение постов подписанных пользователей
app.get('/following-posts', (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ error: 'Пользователь не авторизован' });
    }

    const query = `SELECT posts.id, posts.title, posts.content, users.username 
                   FROM posts 
                   JOIN users ON posts.userId = users.id 
                   JOIN followers ON posts.userId = followers.userId 
                   WHERE followers.followerId = ? 
                   ORDER BY posts.id DESC`;
    db.all(query, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка получения постов' });
        }
        res.status(200).json(rows);
    });
});

// Получение userId текущего пользователя
app.get('/user-id', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Пользователь не авторизован' });
    }
    res.status(200).json({ userId: req.session.userId });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
