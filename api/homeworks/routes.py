"""Module de gestion des devoirs"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from core.extensions import db
from core.models import Homework, Group, User
from core.permissions import get_current_user, prof_or_admin_required, user_in_group
from core.utils import validate_date
from datetime import datetime

homeworks_bp = Blueprint('homeworks', __name__, url_prefix='/api/v1/homeworks')


@homeworks_bp.route('', methods=['GET'])
@jwt_required()
def list_homeworks():
    """Lister les devoirs selon le rôle de l'utilisateur"""
    current_user = get_current_user()
    
    # Paramètres de filtrage
    status = request.args.get('status')  # 'all', 'pending', 'completed', 'overdue'
    group_id = request.args.get('group_id')
    child_id = request.args.get('child_id', type=int)  # Pour les parents
    
    if current_user.role == 'admin':
        # Admin voit tous les devoirs
        query = Homework.query
    elif current_user.role == 'prof':
        # Prof voit uniquement les devoirs qu'il a créés
        query = Homework.query.filter(Homework.author_id == current_user.id)
    elif current_user.role == 'parent':
        # Parent voit les devoirs de ses enfants
        if child_id:
            # Vérifier que l'enfant appartient bien au parent
            child = User.query.get(child_id)
            if not child or child not in current_user.children:
                return jsonify({'error': 'Child not found or not associated with your account'}), 403
            group_ids = [g.id for g in child.groups]
        else:
            # Récupérer tous les devoirs de tous les enfants
            group_ids = []
            for child in current_user.children:
                group_ids.extend([g.id for g in child.groups])
            group_ids = list(set(group_ids))  # Supprimer les doublons
        
        if not group_ids:
            return jsonify({'homeworks': []}), 200
        query = Homework.query.filter(Homework.group_id.in_(group_ids))
    else:
        # Élève voit les devoirs des groupes auxquels il appartient
        group_ids = [g.id for g in current_user.groups]
        if not group_ids:
            return jsonify({'homeworks': []}), 200
        query = Homework.query.filter(Homework.group_id.in_(group_ids))
    
    # Filtrage par groupe
    if group_id:
        query = query.filter(Homework.group_id == int(group_id))
    
    homeworks = query.order_by(Homework.due_date.asc()).all()
    
    # Filtrer par statut (uniquement pour les élèves et parents)
    if status and current_user.role in ['eleve', 'parent']:
        now = datetime.utcnow()
        filtered_homeworks = []
        
        # Pour les parents, utiliser l'enfant sélectionné
        user_id_for_check = child_id if current_user.role == 'parent' and child_id else current_user.id
        
        for h in homeworks:
            is_completed = any(u.id == user_id_for_check for u in h.completed_by)
            is_overdue = h.due_date < now
            
            if status == 'completed' and is_completed:
                filtered_homeworks.append(h)
            elif status == 'overdue' and is_overdue and not is_completed:
                filtered_homeworks.append(h)
            elif status == 'pending' and not is_completed and not is_overdue:
                filtered_homeworks.append(h)
            elif status == 'all':
                filtered_homeworks.append(h)
        
        homeworks = filtered_homeworks
    
    # Utiliser l'ID approprié pour vérifier la complétion
    user_id_for_dict = child_id if current_user.role == 'parent' and child_id else current_user.id
    
    return jsonify({
        'homeworks': [h.to_dict(user_id=user_id_for_dict) for h in homeworks]
    }), 200


@homeworks_bp.route('', methods=['POST'])
@jwt_required()
@prof_or_admin_required
def create_homework():
    """Créer un devoir (prof ou admin)"""
    current_user = get_current_user()
    data = request.get_json()
    
    # Validation
    required_fields = ['title', 'description', 'group_id', 'due_date']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Vérifier que le groupe existe
    group = Group.query.get(data['group_id'])
    if not group:
        return jsonify({'error': 'Group not found'}), 404
    
    # Valider la date
    due_date = validate_date(data['due_date'])
    if not due_date:
        return jsonify({'error': 'Invalid date format'}), 400
    
    # Créer le devoir
    homework = Homework(
        title=data['title'],
        description=data['description'],
        due_date=due_date,
        group_id=data['group_id'],
        author_id=current_user.id,
        attachment_id=data.get('attachment_id'),
        subject=data.get('subject')
    )
    
    db.session.add(homework)
    db.session.commit()
    
    return jsonify({
        'message': 'Homework created successfully',
        'homework': homework.to_dict()
    }), 201


@homeworks_bp.route('/<int:homework_id>', methods=['GET'])
@jwt_required()
def get_homework(homework_id):
    """Obtenir les détails d'un devoir"""
    current_user = get_current_user()
    homework = Homework.query.get(homework_id)
    
    if not homework:
        return jsonify({'error': 'Homework not found'}), 404
    
    # Vérifier les permissions
    if current_user.role == 'admin':
        # Admin peut tout voir
        pass
    elif current_user.role == 'prof':
        # Prof peut voir uniquement ses devoirs
        if homework.author_id != current_user.id:
            return jsonify({'error': 'Access denied'}), 403
    else:
        # Élève peut voir les devoirs de ses groupes
        if homework.group not in current_user.groups:
            return jsonify({'error': 'Access denied'}), 403
    
    return jsonify({
        'homework': homework.to_dict(user_id=current_user.id)
    }), 200


@homeworks_bp.route('/<int:homework_id>', methods=['PUT'])
@jwt_required()
def update_homework(homework_id):
    """Modifier un devoir (propriétaire ou admin)"""
    current_user = get_current_user()
    homework = Homework.query.get(homework_id)
    
    if not homework:
        return jsonify({'error': 'Homework not found'}), 404
    
    # Vérifier les permissions
    if current_user.role != 'admin' and homework.author_id != current_user.id:
        return jsonify({'error': 'Insufficient permissions'}), 403
    
    data = request.get_json()
    
    if 'title' in data:
        homework.title = data['title']
    
    if 'description' in data:
        homework.description = data['description']
    
    if 'due_date' in data:
        due_date = validate_date(data['due_date'])
        if not due_date:
            return jsonify({'error': 'Invalid date format'}), 400
        homework.due_date = due_date
    
    if 'attachment_id' in data:
        homework.attachment_id = data['attachment_id']
    
    if 'subject' in data:
        homework.subject = data['subject']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Homework updated successfully',
        'homework': homework.to_dict()
    }), 200


@homeworks_bp.route('/<int:homework_id>/complete', methods=['POST'])
@jwt_required()
def toggle_homework_completion(homework_id):
    """Marquer un devoir comme fait/non fait (élèves uniquement)"""
    current_user = get_current_user()
    homework = Homework.query.get(homework_id)
    
    if not homework:
        return jsonify({'error': 'Homework not found'}), 404
    
    # Seuls les élèves peuvent marquer des devoirs comme complétés
    if current_user.role != 'eleve':
        return jsonify({'error': 'Only students can mark homeworks as completed'}), 403
    
    # Vérifier que l'utilisateur est dans le groupe du devoir
    if homework.group not in current_user.groups:
        return jsonify({'error': 'You are not in this homework group'}), 403
    
    # Toggle completion
    is_completed = any(u.id == current_user.id for u in homework.completed_by)
    
    if is_completed:
        # Retirer de la liste des complétés
        homework.completed_by = [u for u in homework.completed_by if u.id != current_user.id]
        message = 'Homework marked as not completed'
    else:
        # Ajouter à la liste des complétés
        homework.completed_by.append(current_user)
        message = 'Homework marked as completed'
    
    db.session.commit()
    
    return jsonify({
        'message': message,
        'is_completed': not is_completed,
        'homework': homework.to_dict(user_id=current_user.id)
    }), 200


@homeworks_bp.route('/<int:homework_id>', methods=['DELETE'])
@jwt_required()
def delete_homework(homework_id):
    """Supprimer un devoir (propriétaire ou admin)"""
    current_user = get_current_user()
    homework = Homework.query.get(homework_id)
    
    if not homework:
        return jsonify({'error': 'Homework not found'}), 404
    
    # Vérifier les permissions
    if current_user.role != 'admin' and homework.author_id != current_user.id:
        return jsonify({'error': 'Insufficient permissions'}), 403
    
    db.session.delete(homework)
    db.session.commit()
    
    return jsonify({'message': 'Homework deleted successfully'}), 200
