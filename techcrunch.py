import flask
from db.models import db, Article, Comment

app = flask.Flask(__name__)

@app.route('/')
def index():
    return flask.render_template("layout.html")


@app.route('/article/new', methods=['POST'])
def new_article():
    post_data = flask.request.form
    article_url = post_data['link']
    article = Article.query.filter_by(link=article_url).first()
    if article is None:  # if article doesn't exist then create the article in the database
        article = Article(link=article_url, content=post_data['content'], title=post_data['title'], image=post_data['image'], author=post_data['author'])
        db.session.add(article)
        db.session.commit()
        article = Article.query.filter_by(link=article_url).first()
    return flask.jsonify(article_id=article.id)

@app.route('/article/<int:article_id>/get')
def get_comments(article_id):
    article = Article.query.get(article_id)
    return flask.jsonify(content=article.content, comments=[c.serialize for c in article.comments.all()], title=article.title, image=article.image, author=article.author, id=article.id)

@app.route('/article/<int:article_id>/comments/new', methods=['POST'])
def new_comment(article_id):
    post_data = flask.request.form
    comment = Comment(name=post_data['name'], text=post_data['text'])
    if post_data['location'] is not None:
        comment.location = post_data['location']
    article = Article.query.get(article_id)
    article.comments.append(comment)
    article.content = post_data['content']
    db.session.commit()
    return flask.jsonify(content=article.content, comments=[c.serialize for c in article.comments.all()])

if __name__ == "__main__":
    app.run()
