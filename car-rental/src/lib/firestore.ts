import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentData,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "./firebase";

const collections = {
  clients: "clients",
  cars: "cars",
  contracts: "contracts",
  payments: "payments",
  maintenance: "maintenance",
};

export async function addToCollection<T extends DocumentData>(
  collectionName: string,
  data: T
) {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: Timestamp.now().toDate().toISOString(),
    updatedAt: Timestamp.now().toDate().toISOString(),
  });
  return docRef.id;
}

export async function updateDocument(
  collectionName: string,
  docId: string,
  data: Partial<DocumentData>
) {
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now().toDate().toISOString(),
  });
}

export async function deleteDocument(collectionName: string, docId: string) {
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
}

export async function getDocument<T>(
  collectionName: string,
  docId: string
): Promise<T | null> {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T;
  }
  return null;
}

export async function getCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const q = query(collection(db, collectionName), ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as T)
  );
}

export async function getDocumentsByField<T>(
  collectionName: string,
  field: string,
  value: any
): Promise<T[]> {
  const q = query(
    collection(db, collectionName),
    where(field, "==", value),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as T)
  );
}

export { collections };
