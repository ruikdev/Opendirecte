"""Module de gestion des notes"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from core.extensions import db
from core.models import Note, User
from core.permissions import get_current_user, prof_or_admin_required

notes_bp = Blueprint('notes', __name__, url_prefix='/api/v1/notes')


@notes_bp.route('/students', methods=['GET'])
@jwt_required()
@prof_or_admin_required
def list_students():
    """Lister les élèves (prof: ses élèves, admin: tous)"""
    current_user = get_current_user()
    
    if current_user.role == 'admin':
        students = User.query.filter_by(role='eleve').all()
    else:  # prof
        # Récupérer les élèves dans les groupes du prof
        student_ids = set()
        for group in current_user.groups:
            for member in group.members:
                if member.role == 'eleve':
                    student_ids.add(member.id)
        students = User.query.filter(User.id.in_(student_ids)).all() if student_ids else []
    
    return jsonify({
        'students': [{'id': s.id, 'username': s.username, 'email': s.email, 'groups': [g.name for g in s.groups]} for s in students]
    }), 200


@notes_bp.route('', methods=['GET'])
@jwt_required()
def list_notes():
    """Lister les notes (admin: toutes, prof: leurs notes, élève: leurs notes, parent: notes de leurs enfants)"""
    current_user = get_current_user()
    
    # Paramètre optionnel pour les parents: child_id
    child_id = request.args.get('child_id', type=int)
    
    if current_user.role == 'admin':
        notes = Note.query.all()
    elif current_user.role == 'prof':
        notes = Note.query.filter_by(teacher_id=current_user.id).all()
    elif current_user.role == 'parent':
        # Parent voit les notes de ses enfants
        if child_id:
            # Vérifier que l'enfant appartient bien au parent
            child = User.query.get(child_id)
            if not child or child not in current_user.children:
                return jsonify({'error': 'Child not found or not associated with your account'}), 403
            notes = Note.query.filter_by(student_id=child_id).all()
        else:
            # Récupérer toutes les notes de tous les enfants
            child_ids = [c.id for c in current_user.children]
            notes = Note.query.filter(Note.student_id.in_(child_ids)).all() if child_ids else []
    else:  # eleve
        notes = Note.query.filter_by(student_id=current_user.id).all()
    
    return jsonify({
        'notes': [n.to_dict() for n in notes]
    }), 200


@notes_bp.route('', methods=['POST'])
@jwt_required()
@prof_or_admin_required
def create_note():
    """Ajouter une note (prof ou admin)"""
    current_user = get_current_user()
    data = request.get_json()
    
    # Validation
    required_fields = ['subject', 'value', 'student_id']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Vérifier que l'élève existe
    student = User.query.get(data['student_id'])
    if not student:
        return jsonify({'error': 'Student not found'}), 404
    
    if student.role != 'eleve':
        return jsonify({'error': 'User is not a student'}), 400
    
    # Si prof, vérifier qu'ils partagent un groupe
    if current_user.role == 'prof':
        shared_groups = set(current_user.groups) & set(student.groups)
        if not shared_groups:
            return jsonify({'error': 'You can only grade students in your groups'}), 403
    
    # Créer la note
    note = Note(
        subject=data['subject'],
        value=data['value'],
        max_value=data.get('max_value', 20.0),
        comment=data.get('comment'),
        student_id=data['student_id'],
        teacher_id=current_user.id
    )
    
    db.session.add(note)
    db.session.commit()
    
    return jsonify({
        'message': 'Note created successfully',
        'note': note.to_dict()
    }), 201


@notes_bp.route('/<int:note_id>', methods=['PUT'])
@jwt_required()
def update_note(note_id):
    """Modifier une note (propriétaire ou admin)"""
    current_user = get_current_user()
    note = Note.query.get(note_id)
    
    if not note:
        return jsonify({'error': 'Note not found'}), 404
    
    # Vérifier les permissions
    if current_user.role != 'admin' and note.teacher_id != current_user.id:
        return jsonify({'error': 'Insufficient permissions'}), 403
    
    data = request.get_json()
    
    if 'subject' in data:
        note.subject = data['subject']
    
    if 'value' in data:
        note.value = data['value']
    
    if 'max_value' in data:
        note.max_value = data['max_value']
    
    if 'comment' in data:
        note.comment = data['comment']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Note updated successfully',
        'note': note.to_dict()
    }), 200


@notes_bp.route('/<int:note_id>', methods=['DELETE'])
@jwt_required()
def delete_note(note_id):
    """Supprimer une note (propriétaire ou admin)"""
    current_user = get_current_user()
    note = Note.query.get(note_id)
    
    if not note:
        return jsonify({'error': 'Note not found'}), 404
    
    # Vérifier les permissions
    if current_user.role != 'admin' and note.teacher_id != current_user.id:
        return jsonify({'error': 'Insufficient permissions'}), 403
    
    db.session.delete(note)
    db.session.commit()
    
    return jsonify({'message': 'Note deleted successfully'}), 200
