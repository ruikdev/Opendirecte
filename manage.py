#!/usr/bin/env python3
"""Script CLI pour gérer OpenDirecte - Utilisateurs, Classes, etc."""
import sys
from getpass import getpass
from app import create_app
from core.extensions import db, bcrypt
from core.models import User, Group


def print_help():
    """Afficher l'aide"""
    print("""
OpenDirecte - Gestionnaire CLI
==============================

Commandes disponibles:

  Utilisateurs:
    list-users              - Lister tous les utilisateurs
    create-user             - Créer un nouvel utilisateur
    delete-user <username>  - Supprimer un utilisateur
    reset-password <user>   - Réinitialiser le mot de passe
    set-role <user> <role>  - Changer le rôle (eleve/prof/admin)
    
  Classes/Groupes:
    list-groups             - Lister tous les groupes
    create-group            - Créer un groupe/classe
    delete-group <name>     - Supprimer un groupe
    add-to-group <user> <g> - Ajouter un utilisateur à un groupe
    remove-from-group <u> <g> - Retirer un utilisateur d'un groupe
    
  Base de données:
    init-db                 - Initialiser la base de données
    reset-db                - DANGER: Réinitialiser complètement la DB
    
  Aide:
    help                    - Afficher cette aide

Exemples:
  python manage.py create-user
  python manage.py list-users
  python manage.py create-group
  python manage.py add-to-group john 6A
""")


def list_users():
    """Lister tous les utilisateurs"""
    users = User.query.all()
    if not users:
        print("Aucun utilisateur trouvé.")
        return
    
    print(f"\n{'ID':<5} {'Username':<20} {'Email':<30} {'Role':<10} {'Groupes'}")
    print("-" * 90)
    for user in users:
        groups = ", ".join([g.name for g in user.groups]) or "Aucun"
        print(f"{user.id:<5} {user.username:<20} {user.email:<30} {user.role:<10} {groups}")
    print(f"\nTotal: {len(users)} utilisateurs\n")


def create_user():
    """Créer un nouvel utilisateur"""
    print("\n=== Créer un nouvel utilisateur ===\n")
    
    username = input("Nom d'utilisateur: ").strip()
    if not username:
        print("❌ Le nom d'utilisateur ne peut pas être vide")
        return
    
    if User.query.filter_by(username=username).first():
        print(f"❌ L'utilisateur '{username}' existe déjà")
        return
    
    email = input("Email: ").strip()
    if not email:
        print("❌ L'email ne peut pas être vide")
        return
    
    if User.query.filter_by(email=email).first():
        print(f"❌ L'email '{email}' est déjà utilisé")
        return
    
    print("\nRôles disponibles:")
    print("  1. eleve  - Élève")
    print("  2. prof   - Professeur")
    print("  3. admin  - Administrateur")
    
    role_choice = input("Choisir le rôle (1-3): ").strip()
    role_map = {'1': 'eleve', '2': 'prof', '3': 'admin'}
    role = role_map.get(role_choice)
    
    if not role:
        print("❌ Choix invalide")
        return
    
    password = getpass("Mot de passe: ")
    password_confirm = getpass("Confirmer le mot de passe: ")
    
    if password != password_confirm:
        print("❌ Les mots de passe ne correspondent pas")
        return
    
    if len(password) < 4:
        print("❌ Le mot de passe doit contenir au moins 4 caractères")
        return
    
    # Créer l'utilisateur
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    user = User(
        username=username,
        email=email,
        password=hashed_password,
        role=role
    )
    
    db.session.add(user)
    db.session.commit()
    
    print(f"\n✓ Utilisateur '{username}' créé avec succès (ID: {user.id}, rôle: {role})")


def delete_user(username):
    """Supprimer un utilisateur"""
    user = User.query.filter_by(username=username).first()
    if not user:
        print(f"❌ Utilisateur '{username}' introuvable")
        return
    
    confirm = input(f"Êtes-vous sûr de vouloir supprimer '{username}' ? (oui/non): ")
    if confirm.lower() not in ['oui', 'yes', 'o', 'y']:
        print("Annulé")
        return
    
    db.session.delete(user)
    db.session.commit()
    print(f"✓ Utilisateur '{username}' supprimé")


def reset_password(username):
    """Réinitialiser le mot de passe d'un utilisateur"""
    user = User.query.filter_by(username=username).first()
    if not user:
        print(f"❌ Utilisateur '{username}' introuvable")
        return
    
    password = getpass(f"Nouveau mot de passe pour {username}: ")
    password_confirm = getpass("Confirmer le mot de passe: ")
    
    if password != password_confirm:
        print("❌ Les mots de passe ne correspondent pas")
        return
    
    user.password = bcrypt.generate_password_hash(password).decode('utf-8')
    db.session.commit()
    print(f"✓ Mot de passe de '{username}' réinitialisé")


def set_role(username, role):
    """Changer le rôle d'un utilisateur"""
    if role not in ['eleve', 'prof', 'admin']:
        print(f"❌ Rôle invalide. Utilisez: eleve, prof ou admin")
        return
    
    user = User.query.filter_by(username=username).first()
    if not user:
        print(f"❌ Utilisateur '{username}' introuvable")
        return
    
    old_role = user.role
    user.role = role
    db.session.commit()
    print(f"✓ Rôle de '{username}' changé: {old_role} → {role}")


def list_groups():
    """Lister tous les groupes"""
    groups = Group.query.all()
    if not groups:
        print("Aucun groupe trouvé.")
        return
    
    print(f"\n{'ID':<5} {'Nom':<30} {'Type':<10} {'Membres'}")
    print("-" * 70)
    for group in groups:
        member_count = len(group.members)
        print(f"{group.id:<5} {group.name:<30} {group.type:<10} {member_count}")
    print(f"\nTotal: {len(groups)} groupes\n")


def create_group():
    """Créer un nouveau groupe"""
    print("\n=== Créer un nouveau groupe ===\n")
    
    name = input("Nom du groupe (ex: 6A, Club Math): ").strip()
    if not name:
        print("❌ Le nom ne peut pas être vide")
        return
    
    if Group.query.filter_by(name=name).first():
        print(f"❌ Le groupe '{name}' existe déjà")
        return
    
    print("\nType de groupe:")
    print("  1. classe - Classe scolaire")
    print("  2. club   - Club ou activité")
    
    type_choice = input("Choisir le type (1-2): ").strip()
    type_map = {'1': 'classe', '2': 'club'}
    group_type = type_map.get(type_choice)
    
    if not group_type:
        print("❌ Choix invalide")
        return
    
    group = Group(name=name, type=group_type)
    db.session.add(group)
    db.session.commit()
    
    print(f"\n✓ Groupe '{name}' créé avec succès (ID: {group.id}, type: {group_type})")


def delete_group(name):
    """Supprimer un groupe"""
    group = Group.query.filter_by(name=name).first()
    if not group:
        print(f"❌ Groupe '{name}' introuvable")
        return
    
    confirm = input(f"Êtes-vous sûr de vouloir supprimer le groupe '{name}' ? (oui/non): ")
    if confirm.lower() not in ['oui', 'yes', 'o', 'y']:
        print("Annulé")
        return
    
    db.session.delete(group)
    db.session.commit()
    print(f"✓ Groupe '{name}' supprimé")


def add_to_group(username, group_name):
    """Ajouter un utilisateur à un groupe"""
    user = User.query.filter_by(username=username).first()
    if not user:
        print(f"❌ Utilisateur '{username}' introuvable")
        return
    
    group = Group.query.filter_by(name=group_name).first()
    if not group:
        print(f"❌ Groupe '{group_name}' introuvable")
        return
    
    if group in user.groups:
        print(f"⚠️  '{username}' est déjà dans le groupe '{group_name}'")
        return
    
    user.groups.append(group)
    db.session.commit()
    print(f"✓ '{username}' ajouté au groupe '{group_name}'")


def remove_from_group(username, group_name):
    """Retirer un utilisateur d'un groupe"""
    user = User.query.filter_by(username=username).first()
    if not user:
        print(f"❌ Utilisateur '{username}' introuvable")
        return
    
    group = Group.query.filter_by(name=group_name).first()
    if not group:
        print(f"❌ Groupe '{group_name}' introuvable")
        return
    
    if group not in user.groups:
        print(f"⚠️  '{username}' n'est pas dans le groupe '{group_name}'")
        return
    
    user.groups.remove(group)
    db.session.commit()
    print(f"✓ '{username}' retiré du groupe '{group_name}'")


def init_db():
    """Initialiser la base de données"""
    db.create_all()
    print("✓ Base de données initialisée")


def reset_db():
    """Réinitialiser complètement la base de données"""
    confirm = input("⚠️  ATTENTION: Ceci va supprimer TOUTES les données ! Continuer ? (oui/non): ")
    if confirm.lower() not in ['oui', 'yes', 'o', 'y']:
        print("Annulé")
        return
    
    db.drop_all()
    db.create_all()
    
    # Recréer l'admin par défaut
    admin = User(
        username='admin',
        email='admin@opendirecte.local',
        password=bcrypt.generate_password_hash('admin123').decode('utf-8'),
        role='admin'
    )
    db.session.add(admin)
    db.session.commit()
    
    print("✓ Base de données réinitialisée")
    print("✓ Admin créé (username: admin, password: admin123)")


def main():
    """Point d'entrée principal"""
    app = create_app()
    
    with app.app_context():
        if len(sys.argv) < 2:
            print_help()
            return
        
        command = sys.argv[1].lower()
        
        try:
            if command == 'help':
                print_help()
            elif command == 'list-users':
                list_users()
            elif command == 'create-user':
                create_user()
            elif command == 'delete-user':
                if len(sys.argv) < 3:
                    print("Usage: manage.py delete-user <username>")
                else:
                    delete_user(sys.argv[2])
            elif command == 'reset-password':
                if len(sys.argv) < 3:
                    print("Usage: manage.py reset-password <username>")
                else:
                    reset_password(sys.argv[2])
            elif command == 'set-role':
                if len(sys.argv) < 4:
                    print("Usage: manage.py set-role <username> <role>")
                else:
                    set_role(sys.argv[2], sys.argv[3])
            elif command == 'list-groups':
                list_groups()
            elif command == 'create-group':
                create_group()
            elif command == 'delete-group':
                if len(sys.argv) < 3:
                    print("Usage: manage.py delete-group <name>")
                else:
                    delete_group(sys.argv[2])
            elif command == 'add-to-group':
                if len(sys.argv) < 4:
                    print("Usage: manage.py add-to-group <username> <group_name>")
                else:
                    add_to_group(sys.argv[2], sys.argv[3])
            elif command == 'remove-from-group':
                if len(sys.argv) < 4:
                    print("Usage: manage.py remove-from-group <username> <group_name>")
                else:
                    remove_from_group(sys.argv[2], sys.argv[3])
            elif command == 'init-db':
                init_db()
            elif command == 'reset-db':
                reset_db()
            else:
                print(f"❌ Commande inconnue: {command}")
                print("Tapez 'python manage.py help' pour voir les commandes disponibles")
        
        except Exception as e:
            print(f"❌ Erreur: {e}")
            import traceback
            traceback.print_exc()


if __name__ == '__main__':
    main()
