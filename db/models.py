from flask import Flask
from flask.ext.sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/records.db'
db = SQLAlchemy(app)

class Article(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    link = db.Column(db.Text, unique=True)
    content = db.Column(db.Text)
    title = db.Column(db.Text)
    image = db.Column(db.Text)
    author = db.Column(db.String(50))

    comments = db.relationship('Comment', lazy='dynamic')

    def __init__(self, link, content, title, image, author):
        self.link = link
        self.content = content
        self.title = title
        self.image = image
        self.author = author

    def __repr__(self):
        return '<Article %r>' % self.link

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50))
    text = db.Column(db.Text)
    location = db.Column(db.Text)
    article_id = db.Column(db.Integer, db.ForeignKey('article.id'))

    def __init__(self, name, text):
        self.name = name
        self.text = text
        self.location = 0

    @property
    def serialize(self):
        return {
            'name': self.name,
            'text': self.text,
            'location': self.location
        }
