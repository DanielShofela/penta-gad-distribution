import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp,
  addDoc,
  doc,
  updateDoc,
  runTransaction,
  getDoc,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { Item, TontineGroup, TontineMember, TontinePayment } from "../types";
import {
  Users,
  CreditCard,
  Calendar,
  Trophy,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronRight,
  Zap,
  TrendingUp,
  User as UserIcon,
  Search,
  History,
  LayoutDashboard,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatCurrency, cn } from "../lib/utils";
import { toast } from "sonner";

const TontineDashboard = () => {
  const { user, profile } = useAuth();
  const [userTontines, setUserTontines] = useState<
    { group: TontineGroup; member: TontineMember }[]
  >([]);
  const [selectedTontine, setSelectedTontine] = useState<{
    group: TontineGroup;
    member: TontineMember;
  } | null>(null);
  const [groupMembers, setGroupMembers] = useState<TontineMember[]>([]);
  const [payments, setPayments] = useState<TontinePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "members" | "timeline" | "history" | "discover"
  >("overview");
  const [eligibleItems, setEligibleItems] = useState<Item[]>([]);

  useEffect(() => {
    const q = query(collection(db, "items"), where("allowTontine", "==", true));
    const unsubscribe = onSnapshot(q, (snap) => {
      setEligibleItems(
        snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Item),
      );
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "tontine_members"),
      where("userId", "==", user.uid),
    );

    const unsubscribe = onSnapshot(
      q,
      async (snap) => {
        const tontineData: { group: TontineGroup; member: TontineMember }[] =
          [];

        for (const mDoc of snap.docs) {
          const member = { id: mDoc.id, ...mDoc.data() } as TontineMember;
          try {
            const gDoc = await getDoc(
              doc(db, "tontine_groups", member.groupId),
            );
            if (gDoc.exists()) {
              const group = { id: gDoc.id, ...gDoc.data() } as TontineGroup;
              tontineData.push({ group, member });
            }
          } catch (error) {
            console.error("Error fetching group:", error);
          }
        }

        setUserTontines(tontineData);
        if (tontineData.length > 0 && !selectedTontine) {
          setSelectedTontine(tontineData[0]);
        }
        setLoading(false);
      },
      (error) =>
        handleFirestoreError(error, OperationType.LIST, "tontine_members"),
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!selectedTontine) return;

    // Listen for group members
    const membersQ = query(
      collection(db, "tontine_members"),
      where("groupId", "==", selectedTontine.group.id),
      orderBy("rank", "asc"),
    );
    const unsubMembers = onSnapshot(
      membersQ,
      (snap) => {
        setGroupMembers(
          snap.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as TontineMember,
          ),
        );
      },
      (error) =>
        handleFirestoreError(error, OperationType.LIST, "tontine_members"),
    );

    // Listen for payments
    const paymentsQ = query(
      collection(db, "tontine_payments"),
      where("memberId", "==", selectedTontine.member.id),
      where("userId", "==", user.uid),
      orderBy("paymentDate", "desc"),
    );
    const unsubPayments = onSnapshot(
      paymentsQ,
      (snap) => {
        setPayments(
          snap.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as TontinePayment,
          ),
        );
      },
      (error) =>
        handleFirestoreError(error, OperationType.LIST, "tontine_payments"),
    );

    return () => {
      unsubMembers();
      unsubPayments();
    };
  }, [selectedTontine]);

  const handleMakePayment = async () => {
    if (!selectedTontine || !user) return;

    const amount = selectedTontine.group.contributionAmount;

    try {
      await runTransaction(db, async (transaction) => {
        // 1. Create payment record
        const paymentRef = doc(collection(db, "tontine_payments"));
        const paymentData: TontinePayment = {
          id: paymentRef.id,
          groupId: selectedTontine.group.id,
          memberId: selectedTontine.member.id,
          userId: user.uid,
          amount,
          paymentMethod: "Orange Money", // Simulated
          transactionId:
            "TXN_" + Math.random().toString(36).substring(7).toUpperCase(),
          paymentDate: Timestamp.now(),
          status: "success",
        };
        transaction.set(paymentRef, paymentData);

        // 2. Update member totals
        const memberRef = doc(db, "tontine_members", selectedTontine.member.id);
        const newTotalPaid = selectedTontine.member.totalPaid + amount;
        const newRemaining = selectedTontine.member.remainingAmount - amount;

        // Calculate next payment date (simplified: +1 day for daily)
        let nextDate = Timestamp.now();
        if (selectedTontine.group.contributionFrequency === "daily") {
          nextDate = Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000);
        } else {
          nextDate = Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000);
        }

        transaction.update(memberRef, {
          totalPaid: newTotalPaid,
          remainingAmount: newRemaining,
          nextPaymentDate: nextDate,
        });
      });

      toast.success("Cotisation validée !");
    } catch (error) {
      toast.error("Erreur lors du paiement");
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-gray-100 rounded-3xl w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-[500px] bg-gray-100 rounded-[2rem]"></div>
            <div className="h-[500px] bg-gray-100 rounded-[2rem]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (userTontines.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] p-12 border border-gray-100 shadow-sm"
        >
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8 text-blue-900 shadow-inner">
            <Users size={48} />
          </div>
          <h2 className="text-3xl font-black text-blue-900 mb-4 italic tracking-tight">
            Aucune tontine active
          </h2>
          <p className="text-gray-500 mb-8 text-lg leading-relaxed max-w-md mx-auto">
            Vous n'avez pas encore rejoint de groupe de tontine. Choisissez un
            article éligible et commencez à cotiser avec la communauté.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-blue-900 text-white px-10 py-4 rounded-full font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-900/20"
          >
            Découvrir les articles
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const { group, member } = selectedTontine!;
  const progressPercent =
    (member.totalPaid / (member.totalPaid + member.remainingAmount)) * 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header & Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-blue-900 tracking-tighter italic flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
              <TrendingUp size={28} className="text-blue-900" />
            </div>
            MA TONTINE <span className="text-blue-900/20">DIGITALE</span>
          </h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2 ml-16">
            Système de paiement collaboratif intelligent
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm group">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">
            Mes Groupes
          </span>
          <div className="flex gap-1 overflow-x-auto">
            {userTontines.map((t) => (
              <button
                key={t.group.id}
                onClick={() => setSelectedTontine(t)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                  selectedTontine?.group.id === t.group.id
                    ? "bg-blue-900 text-white shadow-lg"
                    : "bg-gray-50 text-gray-400 hover:bg-sky-50",
                )}
              >
                {t.group.productName.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Group & Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Product Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm overflow-hidden relative group"
          >
            <div className="absolute top-0 right-0 p-4">
              <div className="bg-yellow-400 text-blue-900 text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-md">
                {group.status === "waiting"
                  ? "En attente"
                  : group.status === "active"
                    ? "En cours"
                    : "Terminé"}
              </div>
            </div>
            <img
              src={group.productImage}
              className="w-full aspect-square object-contain mb-6 group-hover:scale-110 transition-transform duration-700"
              alt=""
            />
            <h3 className="text-xl font-black text-blue-900 mb-2 leading-tight uppercase italic">
              {group.productName}
            </h3>
            <div className="flex items-center justify-between mt-4 border-t border-gray-50 pt-4">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Valeur
                </p>
                <p className="font-black text-blue-900">
                  {formatCurrency(member.totalPaid + member.remainingAmount)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Membres
                </p>
                <p className="font-black text-blue-900 flex items-center justify-end gap-1">
                  {group.currentMembers}{" "}
                  <span className="text-gray-300">/ {group.totalMembers}</span>
                </p>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <div className="bg-blue-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -m-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-white/10 rounded-xl">
                  <CreditCard size={20} className="text-yellow-400" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                  Ma Position
                </span>
              </div>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">
                    Rang
                  </p>
                  <p className="text-4xl font-black italic tracking-tighter">
                    #{member.rank}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-black uppercase">
                    <span>Progression</span>
                    <span>{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      className="h-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                    />
                  </div>
                </div>
                <button
                  onClick={handleMakePayment}
                  className="w-full bg-white text-blue-900 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-yellow-400 transition-all shadow-lg active:scale-95"
                >
                  Cotiser {formatCurrency(group.contributionAmount)}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column: Detailed View */}
        <div className="lg:col-span-3 space-y-8">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-8 border-b border-gray-100 pb-0">
            {[
              { id: "overview", label: "Espace", icon: LayoutDashboard },
              { id: "members", label: "Communauté", icon: Users },
              { id: "timeline", label: "Calendrier", icon: Calendar },
              { id: "history", label: "Historique", icon: History },
              { id: "discover", label: "Découvrir", icon: Search },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 pb-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all",
                  activeTab === tab.id
                    ? "border-blue-900 text-blue-900"
                    : "border-transparent text-gray-400 hover:text-blue-500",
                )}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Sections */}
          <AnimatePresence mode="wait">
            {activeTab === "discover" && (
              <motion.div
                key="discover"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xl font-black text-blue-900 uppercase italic">
                    Articles éligibles à la Tontine
                  </h4>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {eligibleItems.length} articles trouvés
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {eligibleItems.map((item) => (
                    <Link
                      to={`/item/${item.id}`}
                      key={item.id}
                      className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group"
                    >
                      <div className="relative aspect-square mb-6 bg-gray-50 rounded-2xl overflow-hidden">
                        <img
                          src={item.imageUrls?.[0] || item.imageUrl}
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700"
                          alt=""
                        />
                        <div className="absolute top-3 right-3 bg-blue-900 text-white text-[8px] font-black uppercase px-3 py-1 rounded-full shadow-lg">
                          1% / Jour
                        </div>
                      </div>
                      <h5 className="font-black text-blue-900 uppercase italic truncate mb-1">
                        {item.name}
                      </h5>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">
                        Valeur: {formatCurrency(item.price)}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                        <div>
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                            Mise Quotidienne
                          </p>
                          <p className="text-sm font-black text-blue-900">
                            {formatCurrency(Math.round(item.price * 0.01))}
                          </p>
                        </div>
                        <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-900 group-hover:bg-blue-900 group-hover:text-white transition-colors">
                          <ChevronRight size={18} />
                        </div>
                      </div>
                    </Link>
                  ))}
                  {eligibleItems.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                      <p className="text-gray-400 italic">
                        Aucun article éligible trouvé pour le moment.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                {/* Next Step Info */}
                <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Clock size={16} className="text-yellow-500" /> Prochain
                      Événement
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex flex-col items-center justify-center font-black">
                          <span className="text-[10px] text-blue-900 opacity-40 leading-none">
                            {format(
                              member.nextPaymentDate?.toDate() || new Date(),
                              "MMM",
                              { locale: fr },
                            )}
                          </span>
                          <span className="text-xl text-blue-900 leading-none">
                            {format(
                              member.nextPaymentDate?.toDate() || new Date(),
                              "dd",
                            )}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-black text-blue-900 uppercase">
                            Prochaine Cotisation
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                            À valider avant 18h00
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-900">
                          <Trophy size={24} className="text-yellow-500" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-blue-900 uppercase">
                            Réception Estimée
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                            Après le cycle #{member.rank}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-gray-50">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-bold uppercase tracking-widest">
                        Total Payé
                      </span>
                      <span className="font-black text-blue-900">
                        {formatCurrency(member.totalPaid)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-2">
                      <span className="text-gray-400 font-bold uppercase tracking-widest">
                        Reste
                      </span>
                      <span className="font-black text-red-500">
                        {formatCurrency(member.remainingAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Group Health/Summary */}
                <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
                  <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Zap size={16} className="text-yellow-500" /> État du Groupe
                  </h4>
                  <div className="space-y-6">
                    <div className="relative">
                      <svg className="w-32 h-32 mx-auto rotate-[-90deg]">
                        <circle
                          cx="64"
                          cy="64"
                          r="58"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-gray-100"
                        />
                        <motion.circle
                          cx="64"
                          cy="64"
                          r="58"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={364}
                          initial={{ strokeDashoffset: 364 }}
                          animate={{
                            strokeDashoffset:
                              364 -
                              364 * (group.currentMembers / group.totalMembers),
                          }}
                          className="text-blue-900"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black italic text-blue-900 leading-none">
                          {group.currentMembers}
                        </span>
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                          Membres
                        </span>
                      </div>
                    </div>
                    <p className="text-center text-xs text-gray-500 leading-relaxed italic px-8">
                      {group.status === "waiting"
                        ? `Il manque encore ${group.totalMembers - group.currentMembers} membres pour démarrer les cycles.`
                        : `Le groupe est actif ! Le cycle actuel est le bénéficiaire #${group.currentCycle}.`}
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="text-center p-4 bg-gray-50 rounded-2xl">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                          Fréquence
                        </p>
                        <p className="text-xs font-black text-blue-900 uppercase tracking-tight">
                          {group.contributionFrequency === "daily"
                            ? "Journalière"
                            : "Hebdo"}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-2xl">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                          Mise
                        </p>
                        <p className="text-xs font-black text-blue-900 uppercase tracking-tight">
                          {formatCurrency(group.contributionAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "members" && (
              <motion.div
                key="members"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm"
              >
                <div className="flex items-center justify-between mb-8">
                  <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest flex items-center gap-2">
                    <Users size={16} className="text-yellow-500" /> Membres du
                    Groupe
                  </h4>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                    {group.currentMembers} actifs
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupMembers.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "p-4 rounded-2xl border transition-all flex items-center gap-4",
                        m.userId === user?.uid
                          ? "bg-blue-50 border-blue-100 shadow-sm scale-105"
                          : "bg-white border-gray-100 hover:border-blue-200",
                      )}
                    >
                      <div className="relative">
                        {m.userId === user?.uid && profile?.photoURL ? (
                          <img
                            src={profile.photoURL}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover shadow-sm border border-blue-100"
                          />
                        ) : m.userPhotoURL ? (
                          <img
                            src={m.userPhotoURL}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover shadow-sm border border-gray-100"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-blue-900 font-bold text-lg">
                            {m.userName.charAt(0)}
                          </div>
                        )}
                        <div
                          className={cn(
                            "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-black text-white",
                            m.rank === group.currentCycle
                              ? "bg-yellow-400"
                              : "bg-blue-900",
                          )}
                        >
                          {m.rank}
                        </div>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-black text-blue-900 truncate uppercase mt-1">
                          {m.userName} {m.userId === user?.uid && "(Moi)"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter",
                              m.status === "active"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700",
                            )}
                          >
                            {m.status === "active" ? "À jour" : "Retard"}
                          </div>
                          {m.hasReceivedProduct && (
                            <div className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter flex items-center gap-0.5">
                              <CheckCircle size={8} /> Reçu
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "timeline" && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm"
              >
                <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest mb-12 flex items-center gap-2">
                  <Calendar size={16} className="text-yellow-500" /> Séquence de
                  Remise
                </h4>
                <div className="relative pl-12 space-y-12 before:content-[''] before:absolute before:left-[1.85rem] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                  {[...Array(group.totalMembers)].map((_, i) => {
                    const rank = i + 1;
                    const m = groupMembers.find(
                      (member) => member.rank === rank,
                    );
                    const isPast = rank < group.currentCycle;
                    const isCurrent = rank === group.currentCycle;
                    const isUser = m?.userId === user?.uid;

                    return (
                      <div key={rank} className="relative group/step">
                        <div
                          className={cn(
                            "absolute -left-[1.65rem] w-6 h-6 rounded-full border-4 border-white shadow-md z-10 transition-all duration-500",
                            isPast
                              ? "bg-green-500 scale-90"
                              : isCurrent
                                ? "bg-yellow-400 scale-125 shadow-yellow-400/50"
                                : "bg-gray-200",
                          )}
                        >
                          {isPast && (
                            <CheckCircle
                              size={10}
                              className="text-white mx-auto mt-0.5"
                            />
                          )}
                        </div>
                        <div
                          className={cn(
                            "p-6 rounded-3xl border transition-all duration-500 flex items-center justify-between",
                            isCurrent
                              ? "bg-blue-900 text-white border-blue-900 shadow-2xl translate-x-2"
                              : isUser
                                ? "bg-blue-50 border-blue-100"
                                : "bg-white border-gray-100 border-dashed",
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={cn(
                                "text-sm font-black italic",
                                isCurrent ? "text-yellow-400" : "text-blue-900",
                              )}
                            >
                              TOUR #{rank}
                            </div>
                            <div className="w-px h-6 bg-current opacity-20" />
                            <div>
                              <p
                                className={cn(
                                  "text-xs font-black uppercase tracking-tight",
                                  isCurrent ? "text-white" : "text-blue-900",
                                )}
                              >
                                {m ? m.userName : `Dossier ${rank}`}
                              </p>
                              <p
                                className={cn(
                                  "text-[10px] font-bold uppercase tracking-widest opacity-60",
                                  isCurrent ? "text-blue-200" : "text-gray-400",
                                )}
                              >
                                {isCurrent
                                  ? "En possession de l'article"
                                  : isPast
                                    ? "Livré avec succès"
                                    : "A venir"}
                              </p>
                            </div>
                          </div>
                          {isUser && !isCurrent && !isPast && (
                            <div className="bg-yellow-400 text-blue-900 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm">
                              C'est moi !
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === "history" && (
              <motion.div
                key="history"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm"
              >
                <div className="flex items-center justify-between mb-8">
                  <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest flex items-center gap-2">
                    <History size={16} className="text-yellow-500" /> Journal
                    des Cotisations
                  </h4>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl border border-gray-100">
                    <Search size={14} className="text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      className="bg-transparent border-none outline-none text-[10px] font-bold w-32"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {payments.map((p) => (
                    <div
                      key={p.id}
                      className="group p-4 bg-gray-50/50 hover:bg-white border hover:border-blue-100 rounded-2xl flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                          <Zap size={16} className="text-blue-900" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-blue-900 uppercase">
                            {p.paymentMethod}
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold font-mono tracking-tighter">
                            REF: {p.transactionId}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-blue-900">
                          -{formatCurrency(p.amount)}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                          {format(p.paymentDate.toDate(), "dd MMM HH:mm", {
                            locale: fr,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {payments.length === 0 && (
                    <div className="py-12 text-center">
                      <Clock size={32} className="mx-auto text-gray-200 mb-4" />
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] italic">
                        Aucun mouvement récent
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default TontineDashboard;
