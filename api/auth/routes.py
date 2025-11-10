"""Module d'authentification"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from core.extensions import db, bcrypt
from core.models import User
from core.permissions import get_current_user, admin_required

auth_bp = Blueprint('auth', __name__, url_prefix='/api/v1/auth')


@auth_bp.route('/register', methods=['POST'])
@jwt_required()
@admin_required
def register():
    """Créer un nouvel utilisateur (admin uniquement)"""
    data = request.get_json()
    
    # Validation
    required_fields = ['username', 'email', 'password', 'role']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    if data['role'] not in ['eleve', 'prof', 'admin']:
        return jsonify({'error': 'Invalid role'}), 400
    
    # Vérifier si l'utilisateur existe déjà
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 409
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 409
    
    # Créer l'utilisateur
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    user = User(
        username=data['username'],
        email=data['email'],
        password=hashed_password,
        role=data['role']
    )
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        'message': 'User created successfully',
        'user': user.to_dict()
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """Authentification et génération de JWT"""
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Missing username or password'}), 400
    
    user = User.query.filter_by(username=data['username']).first()
    
    if not user or not bcrypt.check_password_hash(user.password, data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Créer les tokens avec les claims additionnels
    additional_claims = {
        'role': user.role,
        'groups': [g.name for g in user.groups]
    }
    
    access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
    refresh_token = create_refresh_token(identity=str(user.id))
    
    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    """Obtenir les informations de l'utilisateur actuel"""
    current_user = get_current_user()
    return jsonify(current_user.to_dict()), 200


@auth_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_me():
    """Mettre à jour les informations de l'utilisateur actuel"""
    current_user = get_current_user()
    data = request.get_json()
    
    # Mise à jour de l'email
    if 'email' in data:
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user and existing_user.id != current_user.id:
            return jsonify({'error': 'Email already exists'}), 409
        current_user.email = data['email']
    
    # Mise à jour du mot de passe
    if 'password' in data:
        if 'current_password' not in data:
            return jsonify({'error': 'Current password required'}), 400
        
        if not bcrypt.check_password_hash(current_user.password, data['current_password']):
            return jsonify({'error': 'Invalid current password'}), 401
        
        current_user.password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
    db.session.commit()
    
    return jsonify({
        'message': 'User updated successfully',
        'user': current_user.to_dict()
    }), 200


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Rafraîchir le token d'accès"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    additional_claims = {
        'role': user.role,
        'groups': [g.name for g in user.groups]
    }
    
    access_token = create_access_token(identity=str(current_user_id), additional_claims=additional_claims)
    
    return jsonify({'access_token': access_token}), 200
