"""Module de gestion du calendrier"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from icalendar import Calendar
from datetime import datetime
from core.extensions import db
from core.models import CalendarEvent, Group
from core.permissions import get_current_user, admin_required

calendar_bp = Blueprint('calendar', __name__, url_prefix='/api/v1/calendar')


@calendar_bp.route('', methods=['GET'])
@jwt_required()
def list_events():
    """Lister les événements pour les groupes de l'utilisateur"""
    current_user = get_current_user()
    
    if current_user.role == 'admin':
        events = CalendarEvent.query.all()
    else:
        # Récupérer les événements des groupes de l'utilisateur
        group_ids = [g.id for g in current_user.groups]
        events = CalendarEvent.query.filter(CalendarEvent.group_id.in_(group_ids)).all()
    
    return jsonify({
        'events': [e.to_dict() for e in events]
    }), 200


@calendar_bp.route('/import', methods=['POST'])
@jwt_required()
@admin_required
def import_ics():
    """Importer un fichier .ics pour un groupe (admin uniquement)"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    group_id = request.form.get('group_id')
    
    if not group_id:
        return jsonify({'error': 'Missing group_id'}), 400
    
    group = Group.query.get(group_id)
    if not group:
        return jsonify({'error': 'Group not found'}), 404
    
    if not file.filename.endswith('.ics'):
        return jsonify({'error': 'File must be .ics format'}), 400
    
    try:
        # Lire et parser le fichier ICS
        ics_content = file.read()
        cal = Calendar.from_ical(ics_content)
        
        events_created = 0
        for component in cal.walk():
            if component.name == "VEVENT":
                event = CalendarEvent(
                    title=str(component.get('summary', 'Sans titre')),
                    description=str(component.get('description', '')),
                    start_time=component.get('dtstart').dt,
                    end_time=component.get('dtend').dt,
                    location=str(component.get('location', '')),
                    group_id=group_id
                )
                db.session.add(event)
                events_created += 1
        
        db.session.commit()
        
        return jsonify({
            'message': f'{events_created} events imported successfully'
        }), 201
    
    except Exception as e:
        db.session.rollback()
        # Log the error for debugging but don't expose stack trace
        import logging
        logging.error(f'Failed to import calendar: {str(e)}')
        return jsonify({'error': 'Failed to import calendar'}), 400


@calendar_bp.route('/<int:event_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_event(event_id):
    """Supprimer un événement (admin uniquement)"""
    event = CalendarEvent.query.get(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    db.session.delete(event)
    db.session.commit()
    
    return jsonify({'message': 'Event deleted successfully'}), 200
