"""Initialisation de l'API"""
from flask import Blueprint

api_bp = Blueprint('api', __name__)

# Import des blueprints
from api.auth import auth_bp
from api.users import users_bp
from api.groups import groups_bp
from api.feed import feed_bp
from api.homeworks import homeworks_bp
from api.mail import mail_bp
from api.calendar import calendar_bp
from api.notes import notes_bp
from api.attachments import attachments_bp

__all__ = [
    'auth_bp',
    'users_bp',
    'groups_bp',
    'feed_bp',
    'homeworks_bp',
    'mail_bp',
    'calendar_bp',
    'notes_bp',
    'attachments_bp'
]
