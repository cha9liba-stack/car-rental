import { addToCollection, collections } from "@/lib/firestore";
import { AuditLog } from "@/lib/types";

export async function logAction(
  action: string,
  userName: string,
  targetId: string,
  targetLabel: string,
  details: string = ""
): Promise<string> {
  return addToCollection(collections.auditLogs, {
    action,
    userId: userName,
    userName,
    targetId,
    targetLabel,
    details,
    timestamp: new Date().toISOString(),
  } as any);
}

export function formatAuditAction(action: string, lang: "ar" | "fr"): string {
  const labels: Record<string, Record<string, string>> = {
    create_contract: { ar: "إنشاء عقد", fr: "Création de contrat" },
    update_contract: { ar: "تعديل عقد", fr: "Modification de contrat" },
    delete_contract: { ar: "حذف عقد", fr: "Suppression de contrat" },
    complete_contract: { ar: "إنهاء عقد", fr: "Fin de contrat" },
    cancel_contract: { ar: "إلغاء عقد", fr: "Annulation de contrat" },
    create_client: { ar: "إضافة عميل", fr: "Ajout de client" },
    update_client: { ar: "تعديل عميل", fr: "Modification de client" },
    delete_client: { ar: "حذف عميل", fr: "Suppression de client" },
    create_car: { ar: "إضافة سيارة", fr: "Ajout de véhicule" },
    update_car: { ar: "تعديل سيارة", fr: "Modification de véhicule" },
    delete_car: { ar: "حذف سيارة", fr: "Suppression de véhicule" },
    create_payment: { ar: "تسجيل دفعة", fr: "Enregistrement de paiement" },
    update_payment: { ar: "تعديل دفعة", fr: "Modification de paiement" },
    delete_payment: { ar: "حذف دفعة", fr: "Suppression de paiement" },
    create_maintenance: { ar: "إضافة صيانة", fr: "Ajout de maintenance" },
    update_maintenance: { ar: "تعديل صيانة", fr: "Modification de maintenance" },
    delete_maintenance: { ar: "حذف صيانة", fr: "Suppression de maintenance" },
    create_expense: { ar: "تسجيل مصروف", fr: "Enregistrement de dépense" },
    update_expense: { ar: "تعديل مصروف", fr: "Modification de dépense" },
    delete_expense: { ar: "حذف مصروف", fr: "Suppression de dépense" },
    add_loyalty_points: { ar: "إضافة نقاط ولاء", fr: "Ajout de points fidélité" },
    user_login: { ar: "تسجيل دخول", fr: "Connexion" },
    user_logout: { ar: "تسجيل خروج", fr: "Déconnexion" },
  };
  return labels[action]?.[lang] || action;
}
