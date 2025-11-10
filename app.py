"""Application Flask principale - OpenDirecte"""
import os
from flask import Flask, send_from_directory, render_template
from config import config
from core.extensions import db, bcrypt, jwt, cors


def create_app(config_name='default'):
    """Factory pour créer l'application Flask"""
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialisation des extensions
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    cors.init_app(app)
    
    # Enregistrement des blueprints API
    from api.auth import auth_bp
    from api.users import users_bp
    from api.groups import groups_bp
    from api.feed import feed_bp
    from api.homeworks import homeworks_bp
    from api.mail import mail_bp
    from api.calendar import calendar_bp
    from api.notes import notes_bp
    from api.attachments import attachments_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(groups_bp)
    app.register_blueprint(feed_bp)
    app.register_blueprint(homeworks_bp)
    app.register_blueprint(mail_bp)
    app.register_blueprint(calendar_bp)
    app.register_blueprint(notes_bp)
    app.register_blueprint(attachments_bp)
    
    # Routes pour le frontend
    @app.route('/')
    def index():
        """Page d'accueil / Login"""
        return send_from_directory('frontend', 'index.html')
    
    @app.route('/admin')
    def admin_page():
        """Page d'administration"""
        return send_from_directory('frontend', 'admin.html')
    
    @app.route('/dashboard')
    def dashboard():
        """Tableau de bord"""
        return send_from_directory('frontend', 'dashboard.html')
    
    @app.route('/homework')
    def homework():
        """Page des devoirs"""
        return send_from_directory('frontend', 'homework.html')
    
    @app.route('/messages')
    def messages():
        """Page des messages"""
        return send_from_directory('frontend', 'messages.html')
    
    @app.route('/grades')
    def grades_page():
        """Page de gestion des notes"""
        return send_from_directory('frontend', 'grades.html')
    
    @app.route('/notes')
    def notes_page():
        """Page des notes"""
        return send_from_directory('frontend', 'notes.html')
    
    @app.route('/calendar')
    def calendar_page():
        """Page du calendrier"""
        return send_from_directory('frontend', 'calendar.html')
    
    # Route pour servir les assets frontend
    @app.route('/assets/<path:path>')
    def serve_assets(path):
        """Servir les fichiers CSS/JS"""
        return send_from_directory('frontend/assets', path)
    
    # Création des tables de la base de données
    with app.app_context():
        db.create_all()
        
        # Créer un utilisateur admin par défaut si la base est vide
        from core.models import User
        if User.query.count() == 0:
            admin = User(
                username='admin',
                email='admin@opendirecte.local',
                password=bcrypt.generate_password_hash('admin123').decode('utf-8'),
                role='admin'
            )
            db.session.add(admin)
            db.session.commit()
            print("✓ Admin user created (username: admin, password: admin123)")
    
    return app


if __name__ == '__main__':
    env = os.environ.get('FLASK_ENV', 'development')
    app = create_app(env)
    # Only enable debug in development environment
    debug_mode = env == 'development'
    app.run(host='0.0.0.0', port=5000, debug=debug_mode)
