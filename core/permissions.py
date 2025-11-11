"""Gestion des permissions et autorisations"""
from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from core.extensions import db
from core.models import User


def get_current_user():
    """Récupère l'utilisateur actuel depuis le JWT"""
    verify_jwt_in_request()
    user_id = get_jwt_identity()
    return User.query.get(int(user_id))


def role_required(*roles):
    """Décorateur pour vérifier le rôle de l'utilisateur"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            current_user = get_current_user()
            if not current_user:
                return jsonify({'error': 'User not found'}), 404
            if current_user.role not in roles:
                return jsonify({'error': 'Insufficient permissions'}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def admin_required(f):
    """Décorateur pour les endpoints admin uniquement"""
    return role_required('admin')(f)


def prof_or_admin_required(f):
    """Décorateur pour les endpoints prof ou admin"""
    return role_required('prof', 'admin')(f)


def parent_or_admin_required(f):
    """Décorateur pour les endpoints parent ou admin"""
    return role_required('parent', 'admin')(f)


def is_owner_or_admin(user, resource_user_id):
    """Vérifie si l'utilisateur est propriétaire ou admin"""
    return user.role == 'admin' or user.id == resource_user_id


def user_in_group(user, group_id):
    """Vérifie si l'utilisateur appartient au groupe"""
    return any(g.id == group_id for g in user.groups)


def is_parent_of_child(parent, child_id):
    """Vérifie si l'utilisateur est le parent de l'enfant"""
    if parent.role != 'parent':
        return False
    return any(c.id == child_id for c in parent.children)
