import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.storage.database import SessionLocal
from src.models.models import User
from src.utils.security import get_password_hash


def create_admin_user(email: str, password: str, full_name: str):
    db = SessionLocal()
    try:
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"⚠️ L'utilisateur '{email}' existe déjà. Modification du rôle en 'admin'...")
            existing_user.role = "admin"
            db.commit()
            print(f"✅ Rôle de '{email}' mis à jour en 'admin' avec succès !")
            return

        admin_user = User(
            email=email,
            hashed_password=get_password_hash(password),
            full_name=full_name,
            role="admin",
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        print(f"🎉 Compte administrateur créé avec succès !")
        print(f"   • ID    : {admin_user.id}")
        print(f"   • Email : {admin_user.email}")
        print(f"   • Rôle  : {admin_user.role}")

    except Exception as e:
        db.rollback()
        print(f"❌ Erreur lors de la création : {e}")
    finally:
        db.close()


if __name__ == "__main__":
    create_admin_user(
        email="admin@segula.fr",
        password="AdminSecretPassword123!",
        full_name="Administrateur SEGULA"
    )