import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.storage.database import SessionLocal
from src.models.models import User


def delete_users_by_email(emails: list[str]):
    """
    Supprime les utilisateurs dont l'email est dans la liste
    """
    db = SessionLocal()
    
    try:
        for email in emails:
            # Rechercher l'utilisateur
            user = db.query(User).filter(User.email == email).first()
            
            if user:
                # Supprimer l'utilisateur
                db.delete(user)
                print(f"✅ Utilisateur supprimé : {email} (ID: {user.id})")
            else:
                print(f"⚠️ Utilisateur non trouvé : {email}")
        
        # Valider les modifications
        db.commit()
        print("\n🎉 Tous les utilisateurs ont été supprimés avec succès !")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Erreur lors de la suppression : {e}")
    finally:
        db.close()


if __name__ == "__main__":
    emails_a_supprimer = [
        "mohammed@segulagrp.com"
    ]
    
    print("🗑️ Suppression des utilisateurs...")
    print("📋 Emails à supprimer :")
    for email in emails_a_supprimer:
        print(f"   - {email}")
    print()
    
    # Confirmation (optionnel)
    confirmation = input("⚠️ Confirmer la suppression ? (oui/non) : ")
    if confirmation.lower() == "oui":
        delete_users_by_email(emails_a_supprimer)
    else:
        print("❌ Suppression annulée.")