"""Module de gestion du fil d'actualités"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from core.extensions import db
from core.models import Announcement
from core.permissions import get_current_user, admin_required

feed_bp = Blueprint('feed', __name__, url_prefix='/api/v1/feed')


@feed_bp.route('', methods=['GET'])
@jwt_required()
def list_announcements():
    """Lister les annonces visibles"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    announcements = Announcement.query.order_by(Announcement.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'announcements': [a.to_dict() for a in announcements.items],
        'total': announcements.total,
        'page': page,
        'per_page': per_page,
        'pages': announcements.pages
    }), 200


@feed_bp.route('', methods=['POST'])
@jwt_required()
@admin_required
def create_announcement():
    """Publier une annonce (admin uniquement)"""
    current_user = get_current_user()
    data = request.get_json()
    
    # Validation
    if not data.get('title') or not data.get('content'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Créer l'annonce
    announcement = Announcement(
        title=data['title'],
        content=data['content'],
        author_id=current_user.id
    )
    
    db.session.add(announcement)
    db.session.commit()
    
    return jsonify({
        'message': 'Announcement created successfully',
        'announcement': announcement.to_dict()
    }), 201


@feed_bp.route('/<int:announcement_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_announcement(announcement_id):
    """Modifier une annonce (admin uniquement)"""
    announcement = Announcement.query.get(announcement_id)
    if not announcement:
        return jsonify({'error': 'Announcement not found'}), 404
    
    data = request.get_json()
    
    if 'title' in data:
        announcement.title = data['title']
    
    if 'content' in data:
        announcement.content = data['content']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Announcement updated successfully',
        'announcement': announcement.to_dict()
    }), 200


@feed_bp.route('/<int:announcement_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_announcement(announcement_id):
    """Supprimer une annonce (admin uniquement)"""
    announcement = Announcement.query.get(announcement_id)
    if not announcement:
        return jsonify({'error': 'Announcement not found'}), 404
    
    db.session.delete(announcement)
    db.session.commit()
    
    return jsonify({'message': 'Announcement deleted successfully'}), 200
