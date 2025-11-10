"""Module de gestion de la messagerie"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from core.extensions import db
from core.models import Message, User
from core.permissions import get_current_user, admin_required

mail_bp = Blueprint('mail', __name__, url_prefix='/api/v1/mail')


@mail_bp.route('/inbox', methods=['GET'])
@jwt_required()
def get_inbox():
    """Récupérer les messages reçus"""
    current_user = get_current_user()
    
    messages = Message.query.filter(Message.recipients.contains(current_user)).order_by(
        Message.created_at.desc()
    ).all()
    
    return jsonify({
        'messages': [m.to_dict() for m in messages]
    }), 200


@mail_bp.route('/sent', methods=['GET'])
@jwt_required()
def get_sent():
    """Récupérer les messages envoyés"""
    current_user = get_current_user()
    
    messages = Message.query.filter_by(sender_id=current_user.id).order_by(
        Message.created_at.desc()
    ).all()
    
    return jsonify({
        'messages': [m.to_dict() for m in messages]
    }), 200


@mail_bp.route('/send', methods=['POST'])
@jwt_required()
def send_message():
    """Envoyer un message"""
    current_user = get_current_user()
    data = request.get_json()
    
    # Validation
    required_fields = ['subject', 'content', 'recipients']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    if not isinstance(data['recipients'], list) or not data['recipients']:
        return jsonify({'error': 'Recipients must be a non-empty list'}), 400
    
    # Vérifier que les destinataires existent
    recipients = User.query.filter(User.id.in_(data['recipients'])).all()
    if len(recipients) != len(data['recipients']):
        return jsonify({'error': 'Some recipients not found'}), 404
    
    # Créer le message
    message = Message(
        subject=data['subject'],
        content=data['content'],
        sender_id=current_user.id,
        attachment_id=data.get('attachment_id')
    )
    
    message.recipients.extend(recipients)
    
    db.session.add(message)
    db.session.commit()
    
    return jsonify({
        'message': 'Message sent successfully',
        'mail': message.to_dict()
    }), 201


@mail_bp.route('/<int:message_id>', methods=['GET'])
@jwt_required()
def read_message(message_id):
    """Lire un message"""
    current_user = get_current_user()
    message = Message.query.get(message_id)
    
    if not message:
        return jsonify({'error': 'Message not found'}), 404
    
    # Vérifier que l'utilisateur est destinataire ou expéditeur
    if current_user not in message.recipients and message.sender_id != current_user.id:
        return jsonify({'error': 'Insufficient permissions'}), 403
    
    # Marquer comme lu si l'utilisateur est destinataire
    if current_user in message.recipients and not message.is_read:
        message.is_read = True
        db.session.commit()
    
    return jsonify(message.to_dict()), 200


@mail_bp.route('/<int:message_id>', methods=['DELETE'])
@jwt_required()
def delete_message(message_id):
    """Supprimer un message (expéditeur ou admin)"""
    current_user = get_current_user()
    message = Message.query.get(message_id)
    
    if not message:
        return jsonify({'error': 'Message not found'}), 404
    
    # Vérifier les permissions
    if current_user.role != 'admin' and message.sender_id != current_user.id:
        return jsonify({'error': 'Insufficient permissions'}), 403
    
    db.session.delete(message)
    db.session.commit()
    
    return jsonify({'message': 'Message deleted successfully'}), 200
