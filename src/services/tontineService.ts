import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  Timestamp, 
  limit,
  runTransaction
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { TontineGroup, TontineMember, Item } from '../types';

export const tontineService = {
  // Find a waiting group for a product
  async findAvailableGroup(productId: string) {
    try {
      const q = query(
        collection(db, 'tontine_groups'),
        where('productId', '==', productId),
        where('status', '==', 'waiting'),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return { id: snap.docs[0].id, ...snap.docs[0].data() } as TontineGroup;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'tontine_groups');
      return null;
    }
  },

  // Join or create a tontine group for a product
  async joinTontine(userId: string, userName: string, product: Item) {
    try {
      return await runTransaction(db, async (transaction) => {
        // 1. Check if user is already in a waiting or active group for this product to prevent duplicates
        const memberQuery = query(
          collection(db, 'tontine_members'),
          where('userId', '==', userId),
          where('status', '==', 'active')
        );
        const memberSnap = await getDocs(memberQuery);
        // We filter manually because we can't easily query sub-collection or complex filter in transaction easily without composite index sometimes
        for (const mDoc of memberSnap.docs) {
          const mData = mDoc.data() as TontineMember;
          // Check if this group is for the same product and not completed
          const gDoc = await transaction.get(doc(db, 'tontine_groups', mData.groupId));
          if (gDoc.exists() && gDoc.data().productId === product.id && gDoc.data().status !== 'completed') {
            throw new Error("Vous participez déjà à une tontine pour cet article.");
          }
        }

        // 2. Find a waiting group
        const groupQuery = query(
          collection(db, 'tontine_groups'),
          where('productId', '==', product.id),
          where('status', '==', 'waiting'),
          limit(1)
        );
        const groupSnap = await getDocs(groupQuery);
        
        let groupId: string;
        let groupData: TontineGroup;

        if (groupSnap.empty) {
          // Create new group
          const totalMembers = 10;
          const contributionAmount = Math.ceil(product.price / totalMembers);
          const groupRef = doc(collection(db, 'tontine_groups'));
          groupId = groupRef.id;
          groupData = {
            id: groupId,
            productId: product.id,
            productName: product.name,
            productImage: product.imageUrls?.[0] || '',
            totalMembers,
            currentMembers: 1,
            contributionAmount,
            contributionFrequency: 'daily',
            totalCycles: totalMembers,
            currentCycle: 1,
            startDate: null,
            endDate: null,
            status: 'waiting',
            createdAt: Timestamp.now()
          };
          transaction.set(groupRef, groupData);
        } else {
          const gDoc = groupSnap.docs[0];
          groupId = gDoc.id;
          const existingData = gDoc.data() as TontineGroup;
          
          if (existingData.currentMembers >= existingData.totalMembers) {
            throw new Error("Désolé, ce groupe est déjà complet.");
          }

          const newCount = existingData.currentMembers + 1;
          const isFull = newCount === existingData.totalMembers;
          const status = isFull ? 'active' : 'waiting';
          const startDate = isFull ? Timestamp.now() : null;
          
          transaction.update(doc(db, 'tontine_groups', groupId), {
            currentMembers: newCount,
            status: status,
            startDate: startDate
          });
          groupData = { ...existingData, id: groupId, currentMembers: newCount, status, startDate };
        }

        // 3. Create member entry
        const memberRef = doc(collection(db, 'tontine_members'));
        const memberData: TontineMember = {
          id: memberRef.id,
          groupId: groupId,
          userId: userId,
          userName: userName,
          rank: groupData.currentMembers,
          hasReceivedProduct: false,
          totalPaid: 0,
          remainingAmount: product.price,
          missedPayments: 0,
          nextPaymentDate: groupData.startDate || Timestamp.now(),
          status: 'active',
          joinedAt: Timestamp.now()
        };
        transaction.set(memberRef, memberData);

        return { groupId, memberId: memberRef.id };
      });
    } catch (error) {
      console.error("Join tontine error:", error);
      throw error;
    }
  }
};
