"use client";
import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ThumbsUp, MessageCircle, Upload, Send, ArrowLeft, LogIn, X, Tag, Home, Filter, Eye, EyeOff, Award, Edit, Lock, User, Camera, MessageSquare, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { authAPI, casesAPI, answersAPI, usersAPI, hospitalsAPI, leaderboardAPI, conversationsAPI } from "@/lib/api";
import { countries } from "@/lib/countries";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";

type Urgency = "Urgent ongoing case" | "Non-urgent ongoing case" | "Case study";
interface AnswerItem {
  id: string;
  authorId?: string;
  author: string;
  content: string;
  votes: number;
  specialty: string;
  authorScore: number;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentMimeType?: string | null;
  attachmentSize?: number | null;
}
interface CaseItem {
  id: string; authorId?: string; title: string; author: string; specialty: string; country: string;
  description: string; time: string; votes: number; answers: AnswerItem[]; urgency: Urgency; tags: string[];
  media?: { url: string; type: "image" | "video" }[];
  closed?: boolean;
  edited?: boolean;
  editedAt?: string;
  createdAt: string;
  authorScore: number;
}
type View = "feed" | "post";
interface DoctorScore { name: string; score: number; }

// Helper function to format time ago
const formatTimeAgo = (date: Date | string): string => {
  const now = new Date();
  const past = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString();
};

const normalizePhoneNumber = (value: string = ''): string => {
  if (!value) return '';
  const trimmed = value.replace(/\s+/g, '');
  const hasLeadingPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/[^\d]/g, '');
  if (!digitsOnly) {
    return hasLeadingPlus ? '+' : '';
  }
  return hasLeadingPlus ? `+${digitsOnly}` : digitsOnly;
};

const formatPhoneNumberForDisplay = (value: string = ''): string => {
  const normalized = normalizePhoneNumber(value);
  if (!normalized) return '';
  const hasLeadingPlus = normalized.startsWith('+');
  const digits = hasLeadingPlus ? normalized.slice(1) : normalized;
  if (!digits) return hasLeadingPlus ? '+' : '';

  const groups: string[] = [];
  for (let i = 0; i < digits.length; i += 3) {
    groups.push(digits.slice(i, i + 3));
  }

  const formattedDigits = groups.join(' ').trim();
  return hasLeadingPlus ? `+${formattedDigits}` : formattedDigits;
};

// Helper function to transform backend case to frontend format
const transformCase = (backendCase: any): CaseItem => {
  const authorName = backendCase.author 
    ? `${backendCase.author.firstName || ''} ${backendCase.author.lastName || ''}`.trim() || 'Unknown'
    : 'Unknown';
  const specialty = backendCase.author?.specialty || backendCase.specialty || 'Unknown';
  const country = backendCase.author?.hospital || '—';
  
  return {
    id: backendCase.id,
    title: backendCase.title,
    authorId: backendCase.author?.id || backendCase.authorId || undefined,
    author: authorName,
    specialty,
    country,
    description: backendCase.description,
    time: formatTimeAgo(backendCase.createdAt),
    createdAt: backendCase.createdAt,
    votes: backendCase.votes || 0,
    authorScore: backendCase.author?.score ?? 0,
    answers: (backendCase.answers || [])
      .map((ans: any) => ({
      id: ans.id,
        authorId: ans.author?.id || ans.authorId || undefined,
      author: ans.author ? `${ans.author.firstName || ''} ${ans.author.lastName || ''}`.trim() || 'Unknown' : 'Unknown',
      content: ans.content,
      votes: ans.votes || 0,
      specialty: ans.author?.specialty || ans.specialty || 'Unknown',
        authorScore: ans.author?.score ?? 0,
        attachmentUrl: ans.attachmentUrl || null,
        attachmentName: ans.attachmentName || null,
        attachmentMimeType: ans.attachmentMimeType || null,
        attachmentSize: ans.attachmentSize || null,
      }))
      .sort((a: { votes: number }, b: { votes: number }) => b.votes - a.votes), // Sort by votes descending (top answers first)
    urgency: backendCase.urgency,
    tags: backendCase.tags || [],
    media: backendCase.media || [],
    closed: backendCase.closed || false,
    edited: backendCase.edited || false,
    editedAt: backendCase.editedAt ? formatTimeAgo(backendCase.editedAt) : undefined,
  };
};

const urgencyBadge = (u?: Urgency) => {
  const base = "text-xs px-2 py-1 rounded-full inline-flex items-center gap-1";
  switch (u) {
    case "Urgent ongoing case": return base + " bg-red-100 text-red-700";
    case "Non-urgent ongoing case": return base + " bg-sky-100 text-sky-700";
    case "Case study": return base + " bg-gray-100 text-gray-700";
    default: return base + " bg-gray-100 text-gray-700";
  }
};

export default function Page() {
  const router = useRouter();
  // Routing & auth
  const [view, setView] = useState<View>("feed");
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [isAuthed, setIsAuthed] = useState<boolean>(false);
  const [showAuth, setShowAuth] = useState<boolean>(true); // Start with auth dialog open
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [unreadConversations, setUnreadConversations] = useState<number>(0);
  
  // Auth form state
  const [loginEmail, setLoginEmail] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");
  const [registerData, setRegisterData] = useState({
    title: "Dr.",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    country: "Ghana",
    hospital: "",
    specialty: "",
    licenseNumber: "",
    bio: "",
    credentials: [] as string[],
  });
  const [registerError, setRegisterError] = useState<string>("");
  const [registerFieldErrors, setRegisterFieldErrors] = useState<Record<string, string>>({});
  const [credentialInput, setCredentialInput] = useState<string>("");
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  
  // User profile state
  const [userProfile, setUserProfile] = useState({
    title: "Dr.",
    email: "doctor@example.com",
    password: "",
    hospital: "General Hospital",
    specialty: "General Medicine",
    profilePicture: "",
    firstName: "Dr.",
    lastName: "User",
    phoneNumber: "",
    country: "",
    credentials: [] as string[],
  bio: "",
    score: 0,
    answerVotesReceived: 0,
    caseVotesReceived: 0,
    showPhone: true,
    showEmail: true,
    role: "doctor" as "doctor" | "admin" | "hospital_admin",
  });
  const [editingProfile, setEditingProfile] = useState<boolean>(false);
  const [profileEditData, setProfileEditData] = useState({
    title: "Dr.",
    email: "",
    password: "",
    confirmPassword: "",
    hospital: "",
    specialty: "",
    profilePicture: "",
    phoneNumber: "",
    credentials: [] as string[],
    bio: "",
    showPhone: true,
    showEmail: true,
  });
const [profileCredentialInput, setProfileCredentialInput] = useState<string>("");
  const profilePictureInputRef = useRef<HTMLInputElement>(null);
  
  // Hospital autocomplete state
  const [availableHospitals, setAvailableHospitals] = useState<string[]>([]);
  const [hospitalSearchQuery, setHospitalSearchQuery] = useState<string>("");
  const [showHospitalSuggestions, setShowHospitalSuggestions] = useState<boolean>(false);
  const hospitalInputRef = useRef<HTMLInputElement>(null);
  const hospitalSuggestionsRef = useRef<HTMLDivElement>(null);
  
  // Registration form hospital autocomplete state
  const [registerHospitalQuery, setRegisterHospitalQuery] = useState<string>("");
  const [showRegisterHospitalSuggestions, setShowRegisterHospitalSuggestions] = useState<boolean>(false);
  const registerHospitalInputRef = useRef<HTMLInputElement>(null);
  const registerHospitalSuggestionsRef = useRef<HTMLDivElement>(null);
  const [registerCountryQuery, setRegisterCountryQuery] = useState<string>("Ghana");
  const [showRegisterCountrySuggestions, setShowRegisterCountrySuggestions] = useState<boolean>(false);
  const registerCountryInputRef = useRef<HTMLInputElement>(null);
  const registerCountrySuggestionsRef = useRef<HTMLDivElement>(null);

  const clearRegisterFieldError = (field: string) => {
    setRegisterFieldErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });
  };
  
  // Fetch hospitals from API
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const response = await hospitalsAPI.getAll();
        if (Array.isArray(response)) {
          const hospitalNames = response.map((h: any) => h.name || h);
          setAvailableHospitals(hospitalNames);
        }
      } catch (error) {
        console.error('Error fetching hospitals:', error);
        // Fallback to empty array if API fails
        setAvailableHospitals([]);
      }
    };
    fetchHospitals();
  }, []);

  useEffect(() => {
    if (!isAuthed) {
      setUnreadConversations(0);
      return;
    }

    let cancelled = false;

    const fetchUnread = async () => {
      try {
        const response = await conversationsAPI.list();
        if (cancelled) return;
        const totalUnread = Array.isArray(response)
          ? response.reduce((total: number, conv: any) => total + (conv.unreadCount || 0), 0)
          : 0;
        setUnreadConversations(totalUnread);
      } catch (error) {
        if (!cancelled) {
          setUnreadConversations(0);
        }
      }
    };

    fetchUnread();

    const handler = () => {
      fetchUnread();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('conversations-updated', handler);
    }

    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener('conversations-updated', handler);
      }
    };
  }, [isAuthed]);

  // Update browser tab title with unread count
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (unreadConversations > 0) {
      document.title = `(${unreadConversations}) MedConnect`;
    } else {
      document.title = 'MedConnect';
    }
  }, [unreadConversations]);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthed(true);
      setShowAuth(false);
      // Fetch user profile
      authAPI.getMe().then((user) => {
        setCurrentUserId(user.id || null);
        setUserProfile({
          title: user.title || "Dr.",
          email: user.email || "",
          password: "",
          hospital: user.hospital || "",
          specialty: user.specialty || "",
          profilePicture: user.profilePicture || "",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          phoneNumber: formatPhoneNumberForDisplay(user.phoneNumber || ""),
        country: user.country || "",
        bio: user.bio || "",
        credentials: Array.isArray(user.credentials) ? user.credentials : [],
          score: user.score ?? 0,
          answerVotesReceived: user.answerVotesReceived ?? 0,
          caseVotesReceived: user.caseVotesReceived ?? 0,
          showPhone: user.showPhone !== undefined ? user.showPhone : true,
          showEmail: user.showEmail !== undefined ? user.showEmail : true,
          role: (user.role === "admin" ? "admin" : user.role === "hospital_admin" ? "hospital_admin" : "doctor") as "doctor" | "admin" | "hospital_admin",
        });
      }).catch(() => {
        // Token invalid, clear it
        localStorage.removeItem('token');
        setIsAuthed(false);
        setShowAuth(true);
      });
    } else {
      setShowAuth(true);
    }
  }, []);

  // Require authentication on mount
  useEffect(() => {
    if (!isAuthed) {
      setShowAuth(true);
    }
  }, [isAuthed]);

  // Handle profile opening from localStorage
  useEffect(() => {
    const checkOpenProfile = () => {
      if (typeof window !== 'undefined') {
        const shouldOpenProfile = localStorage.getItem('medconnect-open-profile');
        if (shouldOpenProfile === '1') {
          if (isAuthed) {
            setShowProfile(true);
          } else {
            setShowAuth(true);
          }
          localStorage.removeItem('medconnect-open-profile');
        }
        const shouldShowAuth = localStorage.getItem('medconnect-show-auth');
        if (shouldShowAuth === '1') {
          setShowAuth(true);
          localStorage.removeItem('medconnect-show-auth');
        }
      }
    };

    // Check immediately on mount and when isAuthed changes
    checkOpenProfile();
    
    // Listen for custom event (for same-tab navigation)
    if (typeof window !== 'undefined') {
      const handleCustomEvent = () => checkOpenProfile();
      window.addEventListener('medconnect-open-profile', handleCustomEvent);
      window.addEventListener('medconnect-show-auth', handleCustomEvent);
      window.addEventListener('storage', checkOpenProfile);
      window.addEventListener('focus', checkOpenProfile);
      
      return () => {
        window.removeEventListener('medconnect-open-profile', handleCustomEvent);
        window.removeEventListener('medconnect-show-auth', handleCustomEvent);
        window.removeEventListener('storage', checkOpenProfile);
        window.removeEventListener('focus', checkOpenProfile);
      };
    }
  }, [isAuthed]);

  // Auth handlers
  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError("Please enter email and password");
      return;
    }
    try {
      setAuthLoading(true);
      setLoginError("");
      const response = await authAPI.login({ email: loginEmail, password: loginPassword });
      localStorage.setItem('token', response.token);
      setCurrentUserId(response.user.id || null);
      setUserProfile({
        title: response.user.title || "Dr.",
        email: response.user.email || "",
        password: "",
        hospital: response.user.hospital || "",
        specialty: response.user.specialty || "",
        profilePicture: response.user.profilePicture || "",
        firstName: response.user.firstName || "",
        lastName: response.user.lastName || "",
        phoneNumber: formatPhoneNumberForDisplay(response.user.phoneNumber || ""),
        country: response.user.country || "",
        bio: response.user.bio || "",
        credentials: Array.isArray(response.user.credentials) ? response.user.credentials : [],
        score: response.user.score ?? 0,
        answerVotesReceived: response.user.answerVotesReceived ?? 0,
        caseVotesReceived: response.user.caseVotesReceived ?? 0,
        showPhone: response.user.showPhone !== undefined ? response.user.showPhone : true,
        showEmail: response.user.showEmail !== undefined ? response.user.showEmail : true,
        role: (response.user.role === "admin" ? "admin" : response.user.role === "hospital_admin" ? "hospital_admin" : "doctor") as "doctor" | "admin" | "hospital_admin",
      });
      setIsAuthed(true);
      setShowAuth(false);
      const hospitalToEnsure = (registerData.hospital || registerHospitalQuery).trim();
      if (hospitalToEnsure) {
        await ensureHospitalExists(hospitalToEnsure, registerData.country || '');
      }
      // Refresh cases
      const casesResponse = await casesAPI.getAll({ limit: 20 });
      const backendCases = casesResponse.cases || casesResponse;
      const transformedCases = Array.isArray(backendCases) 
        ? backendCases.map(transformCase)
        : [];
      setCases(transformedCases);
    } catch (error: any) {
      setLoginError(error.message || "Login failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async () => {
    if (
      !registerData.firstName.trim() ||
      !registerData.lastName.trim() ||
      !registerData.email.trim() ||
      !registerData.password.trim() ||
      !registerData.phoneNumber.trim() ||
      !registerData.country.trim() ||
      !registerData.licenseNumber.trim()
    ) {
      setRegisterError("Please fill in all required fields");
      return;
    }
    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError("Passwords do not match");
      return;
    }
    try {
      setAuthLoading(true);
      setRegisterError("");
      setRegisterFieldErrors({});
      const payload = {
        title: registerData.title.trim(),
        firstName: registerData.firstName.trim(),
        lastName: registerData.lastName.trim(),
        email: registerData.email.trim(),
        password: registerData.password,
        phoneNumber: normalizePhoneNumber(registerData.phoneNumber),
        country: registerData.country.trim(),
        hospital: registerData.hospital.trim(),
        specialty: registerData.specialty.trim(),
        licenseNumber: registerData.licenseNumber.trim(),
        bio: registerData.bio.trim(),
        credentials: registerData.credentials,
      };
      const response = await authAPI.register({
        ...payload,
        hospital: registerData.hospital || registerHospitalQuery,
      });
      localStorage.setItem('token', response.token);
      setCurrentUserId(response.user.id || null);
      setUserProfile({
        title: response.user.title || "Dr.",
        email: response.user.email || "",
        password: "",
        hospital: response.user.hospital || "",
        specialty: response.user.specialty || "",
        profilePicture: response.user.profilePicture || "",
        firstName: response.user.firstName || "",
        lastName: response.user.lastName || "",
        phoneNumber: formatPhoneNumberForDisplay(response.user.phoneNumber || ""),
        country: response.user.country || "",
        bio: response.user.bio || "",
        credentials: Array.isArray(response.user.credentials) ? response.user.credentials : [],
        score: response.user.score ?? 0,
        answerVotesReceived: response.user.answerVotesReceived ?? 0,
        caseVotesReceived: response.user.caseVotesReceived ?? 0,
        showPhone: response.user.showPhone !== undefined ? response.user.showPhone : true,
        showEmail: response.user.showEmail !== undefined ? response.user.showEmail : true,
        role: (response.user.role === "admin" ? "admin" : response.user.role === "hospital_admin" ? "hospital_admin" : "doctor") as "doctor" | "admin" | "hospital_admin",
      });
      setIsAuthed(true);
      setShowAuth(false);
      setRegisterData({
        title: "Dr.",
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phoneNumber: "",
        country: "Ghana",
        hospital: "",
        specialty: "",
        licenseNumber: "",
        bio: "",
        credentials: [],
      });
      setCredentialInput("");
      setRegisterCountryQuery("Ghana");
      setRegisterHospitalQuery("");
      setRegisterFieldErrors({});
      // Refresh cases
      const casesResponse = await casesAPI.getAll({ limit: 20 });
      const backendCases = casesResponse.cases || casesResponse;
      const transformedCases = Array.isArray(backendCases) 
        ? backendCases.map(transformCase)
        : [];
      setCases(transformedCases);
    } catch (error: any) {
      // Handle network errors specifically
      if (error.isNetworkError || error.message?.includes('Network error') || error.message?.includes('Failed to fetch')) {
        setRegisterError(
          "Unable to connect to the server. Please check:\n" +
          "• Your internet connection\n" +
          "• That the server is running\n" +
          "• That the API URL is correct in your environment"
        );
      } else {
        const fieldErrors: Record<string, string> = Array.isArray(error?.details)
          ? error.details.reduce((acc: Record<string, string>, detail: any) => {
              if (detail?.param && detail?.msg) {
                acc[detail.param] = detail.msg;
              }
              return acc;
            }, {})
          : {};
        if (Object.keys(fieldErrors).length > 0) {
          setRegisterFieldErrors(fieldErrors);
        }
        setRegisterError(error.message || "Registration failed. Please try again.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Data & filters
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loadingCases, setLoadingCases] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [urgencyFilter, setUrgencyFilter] = useState<"All" | Urgency>("All");
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [filterTagInput, setFilterTagInput] = useState<string>("");
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);
  const [openCasesOnly, setOpenCasesOnly] = useState<boolean>(false);

  // Fetch cases from backend
  const fetchCases = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoadingCases(true);
      }

      const filters: any = {
        page,
        limit: 20,
      };

      // Apply filters if they exist
      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }
      if (urgencyFilter !== "All") {
        filters.urgency = urgencyFilter;
      }
      if (tagFilters.length > 0) {
        filters.tags = tagFilters;
      }
      if (openCasesOnly) {
        filters.openOnly = true;
      }

      const response = await casesAPI.getAll(filters);
      
      // Handle response format
      const backendCases = response.cases || (Array.isArray(response) ? response : []);
        const transformedCases = Array.isArray(backendCases) 
          ? backendCases.map(transformCase)
          : [];

      if (append) {
        setCases(prev => [...prev, ...transformedCases]);
      } else {
        setCases(transformedCases);
      }

      // Update pagination info
      if (response.totalPages !== undefined) {
        setTotalPages(response.totalPages);
        setCurrentPage(response.currentPage || page);
        setHasMore(page < response.totalPages);
      } else {
        // Fallback: if no pagination info, assume no more if we got fewer than limit
        setHasMore(transformedCases.length === 20);
      }
      } catch (error) {
        console.error('Error fetching cases:', error);
      if (!append) {
        setCases([]);
      }
      } finally {
        setLoadingCases(false);
      setLoadingMore(false);
    }
  }, [searchQuery, urgencyFilter, tagFilters, openCasesOnly]);

  // Fetch cases on mount and when filters change (not when tab changes - tabs are client-side sorting only)
  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
    fetchCases(1, false);
  }, [fetchCases]); // Refetch when filters change

  // Fetch leaderboard on mount
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await leaderboardAPI.get(10);
        if (Array.isArray(response)) {
          setLeaders(response.map((l: any) => ({ 
            name: `${l.firstName || ''} ${l.lastName || ''}`.trim() || 'Unknown', 
            score: l.score ?? 0 
          })));
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      }
    };
    fetchLeaderboard();
  }, []);
  
  // Infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Votes & leaderboard
  const [votedAnswers, setVotedAnswers] = useState<Set<string>>(new Set());
  const [votedCases, setVotedCases] = useState<Set<string>>(new Set());
  const [leaders, setLeaders] = useState<DoctorScore[]>([
    { name: "Dr. Owusu", score: 245 },
    { name: "Dr. Boateng", score: 212 },
    { name: "Dr. Yeboah", score: 198 },
    { name: "Dr. Mensah", score: 120 },
  ]);
  const [activeCaseTab, setActiveCaseTab] = useState<'feed' | 'recent'>('feed');

  // Answer
  const [newAnswer, setNewAnswer] = useState<string>("");
  const [answerAttachment, setAnswerAttachment] = useState<File | null>(null);
  const [answerAttachmentPreview, setAnswerAttachmentPreview] = useState<string | null>(null);
  const [answerAttachmentError, setAnswerAttachmentError] = useState<string | null>(null);
  const answerAttachmentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (answerAttachmentPreview) {
        URL.revokeObjectURL(answerAttachmentPreview);
      }
    };
  }, [answerAttachmentPreview]);

  useEffect(() => {
    setNewAnswer('');
    if (answerAttachmentPreview) {
      URL.revokeObjectURL(answerAttachmentPreview);
    }
    setAnswerAttachment(null);
    setAnswerAttachmentPreview(null);
    setAnswerAttachmentError(null);
    if (answerAttachmentInputRef.current) {
      answerAttachmentInputRef.current.value = '';
    }
  }, [selectedCase?.id]);

  // Post page state
  const [caseTitle, setCaseTitle] = useState<string>("");
  const [caseDesc, setCaseDesc] = useState<string>("");
  const [urgency, setUrgency] = useState<"" | Urgency>("");
  const [tagInput, setTagInput] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [mediaFiles, setMediaFiles] = useState<{ url: string; type: "image" | "video" }[]>([]);
  const [blurOn, setBlurOn] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Edit case state
  const [editingCase, setEditingCase] = useState<CaseItem | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editDesc, setEditDesc] = useState<string>("");
  const [editUrgency, setEditUrgency] = useState<"" | Urgency>("");
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [showSBARExample, setShowSBARExample] = useState<boolean>(false);

  const requireAuth = (): boolean => { if (!isAuthed) { setShowAuth(true); return false; } return true; };

  // Navigation handlers
  const handleHomeNav = () => {
    setView('feed');
    setSelectedCase(null);
  };

  const handlePostNav = () => {
    if (requireAuth()) {
      setSelectedCase(null);
      setView('post');
    }
  };

  const handleAccountNav = () => {
    if (isAuthed) {
      setShowProfile(true);
    } else {
      setShowAuth(true);
    }
  };

  // Tag helpers
  const addTag = (raw: string) => {
    const t = raw.trim().replace(/^[#]+/, "").toLowerCase();
    if (!t || tags.includes(t) || tags.length >= 8) return; setTags((p) => [...p, t]);
  };
  const removeTag = (t: string) => setTags((p) => p.filter((x) => x !== t));
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); setTagInput(""); }
    else if (e.key === "Backspace" && !tagInput && tags.length) { e.preventDefault(); setTags((p) => p.slice(0, -1)); }
  };

  // Tag filter helpers
  const addTagFilter = (tag: string) => {
    const normalized = tag.trim().toLowerCase();
    if (normalized && !tagFilters.includes(normalized)) {
      setTagFilters([...tagFilters, normalized]);
      setFilterTagInput("");
    }
  };
  const removeTagFilter = (tag: string) => {
    setTagFilters(tagFilters.filter(t => t !== tag));
  };
  const handleTagFilterKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (filterTagInput.trim()) {
        addTagFilter(filterTagInput);
      }
    } else if (e.key === "Backspace" && !filterTagInput && tagFilters.length) {
      e.preventDefault();
      setTagFilters(tagFilters.slice(0, -1));
    }
  };

  // Derived
  const allTags = useMemo(() => Array.from(new Set(cases.flatMap(c => c.tags || []))), [cases]);
  
  // Sort cases based on active tab (backend already handles filtering)
  const filteredCases = useMemo(() => {
    const urgencyOrder: Record<Urgency, number> = { "Urgent ongoing case": 0, "Non-urgent ongoing case": 1, "Case study": 2 };
    const getCreatedAtTime = (value?: string) => {
      if (!value) return 0;
      const timestamp = new Date(value).getTime();
      return Number.isNaN(timestamp) ? 0 : timestamp;
    };

    // Backend already filters by search, urgency, and tags
    // We only need to handle sorting here
    if (activeCaseTab === 'recent') {
      // Recent tab: sort by createdAt descending (newest first)
      return [...cases].sort(
        (a, b) => getCreatedAtTime(b.createdAt) - getCreatedAtTime(a.createdAt),
      );
    }

    // Feed tab: sort by urgency then createdAt (backend already does this, but we ensure it)
    return [...cases].sort((a, b) => {
      const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (urgencyDiff !== 0) {
        return urgencyDiff;
      }
      return getCreatedAtTime(b.createdAt) - getCreatedAtTime(a.createdAt);
    });
  }, [cases, activeCaseTab]);
  
  // Infinite scroll with Intersection Observer
  useEffect(() => {
    const currentRef = loadMoreRef.current;
    if (!currentRef || !hasMore || loadingMore || loadingCases) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loadingCases) {
          const nextPage = currentPage + 1;
          fetchCases(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(currentRef);
    
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, loadingMore, loadingCases, currentPage, fetchCases]);

  useEffect(() => {
    if (registerData.country && registerData.country !== registerCountryQuery) {
      setRegisterCountryQuery(registerData.country);
    }
  }, [registerData.country, registerCountryQuery]);

  // Media handling
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const items: { url: string; type: "image" | "video" }[] = [];
    Array.from(files).forEach(f => {
      const url = URL.createObjectURL(f);
      const type = f.type.startsWith("video") ? "video" : "image";
      items.push({ url, type });
    });
    setMediaFiles(prev => [...prev, ...items]);
  };
  const removeMedia = (url: string) => setMediaFiles(prev => prev.filter(m => m.url !== url));

  // Voting
  const upvoteAnswer = async (caseId: string | number, answerId: string | number) => {
    const answerIdStr = String(answerId);
    if (!requireAuth() || votedAnswers.has(answerIdStr)) return;
    const caseIdStr = String(caseId);
    const caseEntry = cases.find(c => c.id === caseIdStr) || (selectedCase?.id === caseIdStr ? selectedCase : null);
    if (caseEntry?.closed) {
      alert('This case is closed. Voting is disabled.');
      return;
    }
    try {
      const updatedCaseResponse = await answersAPI.vote(String(caseId), answerIdStr);
      const updatedCase = transformCase(updatedCaseResponse);

      setCases(prev => {
        const index = prev.findIndex(c => c.id === updatedCase.id);
        if (index === -1) return prev;
        const nextCases = [...prev];
        nextCases[index] = updatedCase;
        return nextCases;
      });

      if (selectedCase?.id === caseIdStr) {
        setSelectedCase(updatedCase);
      }

      const previousAnswer =
        caseEntry?.answers.find(a => a.id === answerIdStr) ||
        selectedCase?.answers.find(a => a.id === answerIdStr);
      const updatedAnswer = updatedCase.answers.find(a => a.id === answerIdStr);

      if (
        updatedAnswer &&
        updatedAnswer.authorId &&
        currentUserId &&
        String(updatedAnswer.authorId) === String(currentUserId)
      ) {
        const previousScore = previousAnswer?.authorScore ?? updatedAnswer.authorScore ?? 0;
        const scoreDelta = (updatedAnswer.authorScore ?? 0) - previousScore;
        if (Math.abs(scoreDelta) > 0.0001) {
          const voteDelta = scoreDelta > 0 ? 1 : -1;
          setUserProfile(prev => ({
          ...prev,
            score: parseFloat(((prev.score ?? 0) + scoreDelta).toFixed(2)),
            answerVotesReceived: (prev.answerVotesReceived ?? 0) + voteDelta,
          }));
      }
      }

      setVotedAnswers(new Set([...Array.from(votedAnswers), answerIdStr]));
      // Refresh leaderboard
      const leaderboardResponse = await leaderboardAPI.get(10);
      if (Array.isArray(leaderboardResponse)) {
        setLeaders(leaderboardResponse.map((l: any) => ({ name: `${l.firstName || ''} ${l.lastName || ''}`.trim() || 'Unknown', score: l.score ?? 0 })));
      }
    } catch (error: any) {
      console.error('Error voting on answer:', error);
      alert(error?.message || 'Failed to vote on answer.');
    }
  };
  const upvoteCase = async (caseId: string | number) => {
    const caseIdStr = String(caseId);
    if (!requireAuth() || votedCases.has(caseIdStr)) return;
    const caseEntry = cases.find(c => c.id === caseIdStr) || (selectedCase?.id === caseIdStr ? selectedCase : null);
    if (caseEntry?.closed) {
      alert('This case is closed. Voting is disabled.');
      return;
    }
    try {
      const updatedCaseResponse = await casesAPI.vote(caseIdStr);
      const updatedCase = transformCase(updatedCaseResponse);

      setCases(prev => {
        const index = prev.findIndex(c => c.id === updatedCase.id);
        if (index === -1) return prev;
        const nextCases = [...prev];
        nextCases[index] = updatedCase;
        return nextCases;
      });

      if (selectedCase?.id === caseIdStr) {
        setSelectedCase(updatedCase);
      }

      const previousScore = caseEntry?.authorScore ?? selectedCase?.authorScore ?? 0;
      const updatedScore = updatedCase.authorScore ?? 0;
      const scoreDelta = updatedScore - previousScore;

      if (
        updatedCase.authorId &&
        currentUserId &&
        String(updatedCase.authorId) === String(currentUserId) &&
        Math.abs(scoreDelta) > 0.0001
      ) {
        const voteDelta = scoreDelta > 0 ? 1 : -1;
        setUserProfile(prev => ({
          ...prev,
          score: parseFloat(((prev.score ?? 0) + scoreDelta).toFixed(2)),
          caseVotesReceived: (prev.caseVotesReceived ?? 0) + voteDelta,
        }));
      }

      setVotedCases(new Set([...Array.from(votedCases), caseIdStr]));
      // Refresh leaderboard
      const leaderboardResponse = await leaderboardAPI.get(10);
      if (Array.isArray(leaderboardResponse)) {
        setLeaders(leaderboardResponse.map((l: any) => ({ name: `${l.firstName || ''} ${l.lastName || ''}`.trim() || 'Unknown', score: l.score ?? 0 })));
      }
    } catch (error: any) {
      console.error('Error voting on case:', error);
      alert(error?.message || 'Failed to vote on case.');
    }
  };

  // Submit case
  const canSubmitCase = isAuthed && caseTitle.trim() && caseDesc.trim() && urgency !== "";
  const submitCase = async () => {
    if (!requireAuth() || !canSubmitCase) return;
    try {
      const response = await casesAPI.create({
        title: caseTitle.trim(),
        description: caseDesc.trim(),
        urgency: urgency as Urgency,
        tags: tags,
        media: mediaFiles,
      });
      const transformedCase = transformCase(response);
      setCases([transformedCase, ...cases]);
      setCaseTitle(""); setCaseDesc(""); setUrgency(""); setTags([]); setTagInput(""); setMediaFiles([]);
      setSelectedCase(transformedCase); 
      setView("feed");
    } catch (error) {
      console.error('Error submitting case:', error);
      alert('Failed to submit case. Please try again.');
    }
  };

  // Edit case
  const startEditCase = (caseItem: CaseItem) => {
    setEditingCase(caseItem);
    setEditTitle(caseItem.title);
    setEditDesc(caseItem.description);
    setEditUrgency(caseItem.urgency);
    setShowEditDialog(true);
  };
  const saveEditCase = async () => {
    if (!editingCase || !editTitle.trim() || !editDesc.trim() || !editUrgency) return;
    try {
      const response = await casesAPI.update(editingCase.id, {
        title: editTitle.trim(),
        description: editDesc.trim(),
        urgency: editUrgency as Urgency,
      });
      const transformedCase = transformCase(response);
      setCases(prev => prev.map(c => 
        c.id === editingCase.id ? transformedCase : c
      ));
      if (selectedCase?.id === editingCase.id) {
        setSelectedCase(transformedCase);
      }
      setShowEditDialog(false);
      setEditingCase(null);
      setEditTitle(""); setEditDesc(""); setEditUrgency("");
    } catch (error) {
      console.error('Error updating case:', error);
      alert('Failed to update case. Please try again.');
    }
  };
  const cancelEditCase = () => {
    setShowEditDialog(false);
    setEditingCase(null);
    setEditTitle(""); setEditDesc(""); setEditUrgency("");
  };

  // Close case
  const closeCase = async (caseId: string | number) => {
    try {
      await casesAPI.close(String(caseId));
      setCases(prev => prev.map(c => c.id === String(caseId) ? { ...c, closed: true } : c));
      if (selectedCase?.id === String(caseId)) {
        setSelectedCase({ ...selectedCase, closed: true });
      }
    } catch (error) {
      console.error('Error closing case:', error);
      alert('Failed to close case. Please try again.');
    }
  };

  // Check if user is case author
  const isCaseAuthor = (caseItem: CaseItem) => {
    if (!isAuthed || !currentUserId) return false;
    if (caseItem.authorId) {
      return String(caseItem.authorId) === String(currentUserId);
    }
    const currentUserName = `${userProfile.firstName} ${userProfile.lastName}`.trim();
    return caseItem.author === currentUserName || caseItem.author === "You";
  };

  // Profile functions
  const startEditProfile = () => {
    setProfileEditData({
      title: userProfile.title || "Dr.",
      email: userProfile.email,
      password: "",
      confirmPassword: "",
      hospital: userProfile.hospital,
      specialty: userProfile.specialty,
      profilePicture: userProfile.profilePicture,
    phoneNumber: formatPhoneNumberForDisplay(userProfile.phoneNumber),
    credentials: Array.isArray(userProfile.credentials) ? [...userProfile.credentials] : [],
    bio: userProfile.bio || "",
    showPhone: userProfile.showPhone !== undefined ? userProfile.showPhone : true,
    showEmail: userProfile.showEmail !== undefined ? userProfile.showEmail : true,
    });
    setHospitalSearchQuery(userProfile.hospital);
  setProfileCredentialInput("");
    setEditingProfile(true);
  };
  
  // Hospital autocomplete functions
  const filteredHospitals = useMemo(() => {
    if (!hospitalSearchQuery.trim()) return availableHospitals;
    const query = hospitalSearchQuery.toLowerCase();
    return availableHospitals.filter(h => h.toLowerCase().includes(query));
  }, [hospitalSearchQuery, availableHospitals]);
  
  const handleHospitalSelect = (hospital: string) => {
    setProfileEditData(prev => ({ ...prev, hospital }));
    setHospitalSearchQuery(hospital);
    setShowHospitalSuggestions(false);
  };
  
  const handleHospitalInputChange = (value: string) => {
    setHospitalSearchQuery(value);
    setProfileEditData(prev => ({ ...prev, hospital: value }));
    setShowHospitalSuggestions(true);
  };
  
  const handleHospitalInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowHospitalSuggestions(false);
    }, 200);
  };
  
  const ensureHospitalExists = async (hospitalName: string, country: string = "") => {
    const normalized = hospitalName.trim();
    if (!normalized) {
      return;
    }
    const normalizedLower = normalized.toLowerCase();
    const alreadyExists = availableHospitals.some(h => h.toLowerCase() === normalizedLower);
    if (!alreadyExists) {
      setAvailableHospitals(prev => {
        if (prev.some(h => h.toLowerCase() === normalizedLower)) {
          return prev;
        }
        return [...prev, normalized].sort((a, b) => a.localeCompare(b));
      });
      try {
        await hospitalsAPI.create({ name: normalized, country });
      } catch (error) {
        console.error('Error creating hospital:', error);
      }
    }
  };

  const handleAddNewHospital = async () => {
    const newHospital = hospitalSearchQuery.trim();
    if (newHospital) {
      await ensureHospitalExists(newHospital, userProfile.country || '');
      setProfileEditData(prev => ({ ...prev, hospital: newHospital }));
    }
    setShowHospitalSuggestions(false);
  };

const addProfileCredential = (raw?: string) => {
  const value = (raw ?? profileCredentialInput).trim();
  if (!value) return;
  setProfileEditData(prev => {
    const existing = Array.isArray(prev.credentials) ? prev.credentials : [];
    if (existing.includes(value) || existing.length >= 10) return prev;
    return { ...prev, credentials: [...existing, value] };
  });
  setProfileCredentialInput("");
};

const removeProfileCredential = (credential: string) => {
  setProfileEditData(prev => ({
    ...prev,
    credentials: (prev.credentials || []).filter(c => c !== credential),
  }));
};

const handleProfileCredentialKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    addProfileCredential();
  } else if (
    e.key === 'Backspace' &&
    !profileCredentialInput &&
    (profileEditData.credentials?.length || 0) > 0
  ) {
    e.preventDefault();
    const creds = profileEditData.credentials || [];
    removeProfileCredential(creds[creds.length - 1]);
  }
  };
  
  // Registration hospital autocomplete functions
  const filteredRegisterHospitals = useMemo(() => {
    if (!registerHospitalQuery.trim()) return availableHospitals;
    const query = registerHospitalQuery.toLowerCase();
    return availableHospitals.filter(h => h.toLowerCase().includes(query));
  }, [registerHospitalQuery, availableHospitals]);

  const filteredRegisterCountries = useMemo(() => {
    const query = registerCountryQuery.trim().toLowerCase();
    if (!query) return countries;
    return countries.filter(country => country.name.toLowerCase().includes(query));
  }, [registerCountryQuery]);
  
  const handleRegisterHospitalSelect = (hospital: string) => {
    setRegisterHospitalQuery(hospital);
    setRegisterData(prev => ({ ...prev, hospital }));
    clearRegisterFieldError('hospital');
    setShowRegisterHospitalSuggestions(false);
  };
  
  const handleRegisterHospitalInputChange = (value: string) => {
    setRegisterHospitalQuery(value);
    setShowRegisterHospitalSuggestions(true);
  };
  
  const handleRegisterHospitalInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowRegisterHospitalSuggestions(false);
    }, 200);
  };
  
  const handleRegisterCountrySelect = (countryName: string) => {
    setRegisterCountryQuery(countryName);
    setRegisterData(prev => ({ ...prev, country: countryName }));
    clearRegisterFieldError('country');
    setShowRegisterCountrySuggestions(false);
  };

  const handleRegisterCountryInputChange = (value: string) => {
    setRegisterCountryQuery(value);
    setRegisterData(prev => ({ ...prev, country: value }));
    clearRegisterFieldError('country');
    setShowRegisterCountrySuggestions(true);
  };

  const handleRegisterCountryInputBlur = () => {
    setTimeout(() => {
      setShowRegisterCountrySuggestions(false);
      const normalized = registerCountryQuery.trim();
      if (!normalized) {
        setRegisterData(prev => ({ ...prev, country: "" }));
        return;
      }
      const match = countries.find(country => country.name.toLowerCase() === normalized.toLowerCase());
      if (match) {
        setRegisterData(prev => ({ ...prev, country: match.name }));
        setRegisterCountryQuery(match.name);
      }
    }, 200);
  };
  
  const handleAddNewRegisterHospital = () => {
    const newHospital = registerHospitalQuery.trim();
    if (newHospital) {
      const newHospitalLower = newHospital.toLowerCase();
      setRegisterHospitalQuery(newHospital);
      setRegisterData(prev => ({ ...prev, hospital: newHospital }));
      clearRegisterFieldError('hospital');
      setAvailableHospitals(prev => {
        if (prev.some(h => h.toLowerCase() === newHospitalLower)) {
          return prev;
        }
        return [...prev, newHospital].sort((a, b) => a.localeCompare(b));
      });
    }
    setShowRegisterHospitalSuggestions(false);
  };
  const handleProfilePhoneInputChange = (value: string) => {
    const formatted = formatPhoneNumberForDisplay(value);
    setProfileEditData(prev => ({ ...prev, phoneNumber: formatted }));
  };
  const addCredential = (raw?: string) => {
    const value = (raw ?? credentialInput).trim();
    if (!value) return;
    if (registerData.credentials.includes(value) || registerData.credentials.length >= 10) return;
    setRegisterData(prev => ({ ...prev, credentials: [...prev.credentials, value] }));
    setCredentialInput("");
    clearRegisterFieldError('credentials');
  };

  const removeCredential = (credential: string) => {
    setRegisterData(prev => ({
      ...prev,
      credentials: prev.credentials.filter(c => c !== credential),
    }));
  };

  const handleCredentialKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addCredential();
    } else if (e.key === 'Backspace' && !credentialInput && registerData.credentials.length) {
      e.preventDefault();
      removeCredential(registerData.credentials[registerData.credentials.length - 1]);
    }
  };

  const handlePhoneNumberInputChange = (value: string) => {
    const formatted = formatPhoneNumberForDisplay(value);
    setRegisterData(prev => ({ ...prev, phoneNumber: formatted }));
    clearRegisterFieldError('phoneNumber');
  };
  const saveProfile = async () => {
    if (profileEditData.password && profileEditData.password !== profileEditData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    try {
      const hospitalToSave = hospitalSearchQuery.trim() || profileEditData.hospital || userProfile.hospital;
      const phoneToSave = profileEditData.phoneNumber
        ? normalizePhoneNumber(profileEditData.phoneNumber)
        : normalizePhoneNumber(userProfile.phoneNumber);
      const credentialsToSave = Array.isArray(profileEditData.credentials)
        ? profileEditData.credentials.map((cred) => cred.trim()).filter(Boolean).slice(0, 10)
        : [];
      const updateData: any = {
        title: profileEditData.title || userProfile.title || "Dr.",
        email: profileEditData.email || userProfile.email,
        hospital: hospitalToSave,
        specialty: profileEditData.specialty || userProfile.specialty,
        phoneNumber: phoneToSave || '',
        credentials: credentialsToSave,
        bio: (profileEditData.bio || "").trim(),
        showPhone: profileEditData.showPhone !== undefined ? profileEditData.showPhone : (userProfile.showPhone !== undefined ? userProfile.showPhone : true),
        showEmail: profileEditData.showEmail !== undefined ? profileEditData.showEmail : (userProfile.showEmail !== undefined ? userProfile.showEmail : true),
      };
      if (profileEditData.password) {
        updateData.password = profileEditData.password;
      }
      
      const response = await usersAPI.updateProfile(updateData);
      
      if (!response) {
        throw new Error('No response from server');
      }
      setUserProfile({
        title: response.title || userProfile.title || "Dr.",
        email: response.email || userProfile.email,
        password: "",
        hospital: response.hospital || hospitalToSave,
        specialty: response.specialty || userProfile.specialty,
        profilePicture: response.profilePicture || userProfile.profilePicture,
        firstName: response.firstName || userProfile.firstName,
        lastName: response.lastName || userProfile.lastName,
        phoneNumber: formatPhoneNumberForDisplay(response.phoneNumber || phoneToSave || userProfile.phoneNumber),
        country: response.country || userProfile.country || "",
        bio: response.bio ?? (profileEditData.bio || userProfile.bio || ""),
        credentials: Array.isArray(response.credentials) ? response.credentials : userProfile.credentials,
        score: response.score ?? userProfile.score ?? 0,
        answerVotesReceived: response.answerVotesReceived ?? userProfile.answerVotesReceived ?? 0,
        caseVotesReceived: response.caseVotesReceived ?? userProfile.caseVotesReceived ?? 0,
        showPhone: response.showPhone !== undefined ? response.showPhone : userProfile.showPhone !== undefined ? userProfile.showPhone : true,
        showEmail: response.showEmail !== undefined ? response.showEmail : userProfile.showEmail !== undefined ? userProfile.showEmail : true,
        role: (response.role === "admin" ? "admin" : userProfile.role) as "doctor" | "admin",
      });
      // Add new hospital to list if it doesn't exist
      if (hospitalToSave) {
        await ensureHospitalExists(hospitalToSave, response.country || userProfile.country || '');
      }
      setEditingProfile(false);
      setProfileEditData({
        title: "",
        email: "",
        password: "",
        confirmPassword: "",
        hospital: "",
        specialty: "",
        profilePicture: "",
        phoneNumber: "",
        credentials: [],
        bio: "",
        showPhone: false,
        showEmail: false,
      });
      setProfileCredentialInput("");
      setHospitalSearchQuery("");
      setShowHospitalSuggestions(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMessage = error.message || error.error || error.details || 'Failed to update profile. Please check your input and try again.';
      if (error.details && Array.isArray(error.details)) {
        const validationErrors = error.details.map((d: any) => d.msg || d.message).join('\n');
        alert(`Validation errors:\n${validationErrors}`);
      } else {
        alert(errorMessage);
      }
    }
  };
  const cancelEditProfile = () => {
    setEditingProfile(false);
    setProfileEditData({
      title: "Dr.",
      email: "",
      password: "",
      confirmPassword: "",
      hospital: "",
      specialty: "",
      profilePicture: "",
      phoneNumber: "",
      credentials: [],
      bio: "",
      showPhone: true,
      showEmail: true,
    });
    setProfileCredentialInput("");
    setHospitalSearchQuery("");
    setShowHospitalSuggestions(false);
  };
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProfileEditData(prev => ({ ...prev, profilePicture: url }));
    }
  };

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Reset state
    setIsAuthed(false);
    setCurrentUserId(null);
    setShowProfile(false);
    setShowAuth(true);
    
    // Reset user profile to default
    setUserProfile({
      title: "Dr.",
      email: "",
      password: "",
      hospital: "",
      specialty: "",
      profilePicture: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      country: "",
      bio: "",
      credentials: [],
      score: 0,
      answerVotesReceived: 0,
      caseVotesReceived: 0,
      showPhone: true,
      showEmail: true,
      role: "doctor" as "doctor" | "admin" | "hospital_admin",
    });
    
    // Reset selected case and view
    setSelectedCase(null);
    setView("feed");
  };

  const Header = (
    <header className="sticky-header bg-white rounded-none md:rounded-xl shadow-sm">
      <div className="max-w-5xl mx-auto px-2 py-1.5 flex items-center gap-1.5">
        {selectedCase && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedCase(null);
              setActiveCaseTab('feed');
            }}
            aria-label="Back"
          >
            <ArrowLeft size={16} />
        </Button>
        )}
        <Link href="/" className="flex items-center gap-1.5 text-gray-800 flex-1">
          <Image
            src="/medconnect-logo.svg"
            alt="MedConnect logo"
            width={24}
            height={24}
            priority
          />
          <span className="text-sm font-bold text-gray-800">
            MedConnect
          </span>
        </Link>
        <Link href="/messages" className="relative hidden sm:inline-flex">
          <Button variant="ghost" size="icon" aria-label="Messages">
            <MessageSquare size={16} />
          </Button>
          {unreadConversations > 0 && (
            <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-semibold px-1 py-0.5 min-w-[14px]">
              {unreadConversations > 9 ? '9+' : unreadConversations}
            </span>
          )}
        </Link>
      </div>
    </header>
  );

  // Show auth dialog if not authenticated
  if (!isAuthed) {
    return (
      <div className="min-h-screen safe-bottom flex items-center justify-center bg-gray-50">
        <Dialog open={showAuth} onOpenChange={() => {}}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{authTab === "login" ? "Login" : "Register as a Doctor"}</DialogTitle>
            </DialogHeader>
            <Tabs value={authTab} onValueChange={(val: string) => setAuthTab(val as "login" | "register")} className="mt-2">
              <TabsList>
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="space-y-3">
                {loginError && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{loginError}</div>
                )}
                <Input 
                  placeholder="Email" 
                  type="email" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
                <Input 
                  placeholder="Password" 
                  type="password" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleLogin();
                    }
                  }}
                />
                <DialogFooter>
                  <Button 
                    onClick={handleLogin} 
                    disabled={authLoading}
                  >
                    {authLoading ? "Logging in..." : "Login"}
                  </Button>
                </DialogFooter>
              </TabsContent>
              <TabsContent value="register" className="space-y-3 pt-2">
                {registerError && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded whitespace-pre-line">{registerError}</div>
                )}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Personal Information</h4>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">Title</label>
                    <select 
                      className="w-full h-10 rounded-2xl border border-gray-300 px-3 text-sm bg-white appearance-none [-webkit-appearance:none] leading-normal"
                      value={registerData.title}
                      onChange={(e) => {
                        clearRegisterFieldError('title');
                        setRegisterData({...registerData, title: e.target.value});
                      }}
                    >
                      <option value="Dr (Med)">Dr (Med)</option>
                      <option value="Prof.">Prof.</option>
                      <option value="Dr (Den)">Dr (Den)</option>
                      <option value="Dr (Opt)">Dr (Opt)</option>
                      <option value="Dr.">Dr.</option>
                      <option value="Mr.">Mr.</option>
                      <option value="Mrs.">Mrs.</option>
                      <option value="Miss">Miss</option>
                    </select>
                    {registerFieldErrors.title && (
                      <p className="text-xs text-red-600">{registerFieldErrors.title}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                    <Input 
                      placeholder="First Name" 
                        className={`h-10 text-sm ${registerFieldErrors.firstName ? 'border-red-500 focus-visible:ring-red-500' : ''}`} 
                      value={registerData.firstName}
                        onChange={(e) => {
                          clearRegisterFieldError('firstName');
                          setRegisterData({...registerData, firstName: e.target.value});
                        }}
                    />
                      {registerFieldErrors.firstName && (
                        <p className="text-xs text-red-600">{registerFieldErrors.firstName}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                    <Input 
                      placeholder="Last Name" 
                        className={`h-10 text-sm ${registerFieldErrors.lastName ? 'border-red-500 focus-visible:ring-red-500' : ''}`} 
                      value={registerData.lastName}
                        onChange={(e) => {
                          clearRegisterFieldError('lastName');
                          setRegisterData({...registerData, lastName: e.target.value});
                        }}
                    />
                      {registerFieldErrors.lastName && (
                        <p className="text-xs text-red-600">{registerFieldErrors.lastName}</p>
                      )}
                  </div>
                  </div>
                  <div className="flex flex-col gap-1">
                  <Input 
                    placeholder="Email" 
                    type="email" 
                      className={`h-10 text-sm ${registerFieldErrors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`} 
                    value={registerData.email}
                      onChange={(e) => {
                        clearRegisterFieldError('email');
                        setRegisterData({...registerData, email: e.target.value});
                      }}
                  />
                    {registerFieldErrors.email && (
                      <p className="text-xs text-red-600">{registerFieldErrors.email}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                  <Input 
                    placeholder="Phone Number" 
                    type="tel" 
                      className={`h-10 text-sm ${registerFieldErrors.phoneNumber ? 'border-red-500 focus-visible:ring-red-500' : ''}`} 
                    value={registerData.phoneNumber}
                      onChange={(e) => handlePhoneNumberInputChange(e.target.value)}
                      onBlur={() => clearRegisterFieldError('phoneNumber')}
                  />
                    <p className="text-[10px] text-gray-500">Enter in international format (e.g. +233 200 000 000).</p>
                    {registerFieldErrors.phoneNumber && (
                      <p className="text-xs text-red-600">{registerFieldErrors.phoneNumber}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Account Security</h4>
                  <div className="flex flex-col gap-1">
                  <Input 
                    placeholder="Create Password" 
                    type="password" 
                      className={`h-10 text-sm ${registerFieldErrors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`} 
                    value={registerData.password}
                      onChange={(e) => {
                        clearRegisterFieldError('password');
                        setRegisterData({...registerData, password: e.target.value});
                      }}
                    />
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Password must be at least 8 characters and include: uppercase letter, lowercase letter, and number
                    </p>
                    {registerFieldErrors.password && (
                      <p className="text-xs text-red-600">{registerFieldErrors.password}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                  <Input 
                    placeholder="Confirm Password" 
                    type="password" 
                    className="h-10 text-sm" 
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                  />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Professional Details</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative flex flex-col gap-1">
                    <Input 
                        ref={registerCountryInputRef}
                        placeholder="Search or select country"
                        value={registerCountryQuery}
                        onChange={(e) => handleRegisterCountryInputChange(e.target.value)}
                        onFocus={() => setShowRegisterCountrySuggestions(true)}
                        onBlur={handleRegisterCountryInputBlur}
                        className={`h-10 text-sm ${registerFieldErrors.country ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                      />
                      {showRegisterCountrySuggestions && (
                        <div
                          ref={registerCountrySuggestionsRef}
                          className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          {filteredRegisterCountries.map((country) => (
                            <button
                              key={country.code}
                              type="button"
                              onClick={() => handleRegisterCountrySelect(country.name)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors first:rounded-t-lg last:rounded-b-lg"
                            >
                              {country.name}
                            </button>
                          ))}
                        </div>
                      )}
                      {registerFieldErrors.country && (
                        <p className="text-xs text-red-600">{registerFieldErrors.country}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                    <Input 
                        placeholder="Medical License No." 
                        className={`h-10 text-sm ${registerFieldErrors.licenseNumber ? 'border-red-500 focus-visible:ring-red-500' : ''}`} 
                      value={registerData.licenseNumber}
                        onChange={(e) => {
                          clearRegisterFieldError('licenseNumber');
                          setRegisterData({...registerData, licenseNumber: e.target.value});
                        }}
                    />
                      {registerFieldErrors.licenseNumber && (
                        <p className="text-xs text-red-600">{registerFieldErrors.licenseNumber}</p>
                      )}
                  </div>
                  </div>
                  <div className="relative flex flex-col gap-1">
                    <Input
                      ref={registerHospitalInputRef}
                      placeholder="Search or type hospital name..."
                      value={registerHospitalQuery}
                      onChange={(e) => {
                        handleRegisterHospitalInputChange(e.target.value);
                        setRegisterData({...registerData, hospital: e.target.value});
                        clearRegisterFieldError('hospital');
                      }}
                      onFocus={() => setShowRegisterHospitalSuggestions(true)}
                      onBlur={handleRegisterHospitalInputBlur}
                      className={`h-10 text-sm ${registerFieldErrors.hospital ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    />
                    {showRegisterHospitalSuggestions && registerHospitalQuery.trim() && (
                      <div
                        ref={registerHospitalSuggestionsRef}
                        className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        {filteredRegisterHospitals.length > 0 ? (
                          <>
                            {filteredRegisterHospitals.map((hospital, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleRegisterHospitalSelect(hospital)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors first:rounded-t-lg last:rounded-b-lg"
                              >
                                {hospital}
                              </button>
                            ))}
                            {!filteredRegisterHospitals.includes(registerHospitalQuery.trim()) && (
                              <button
                                type="button"
                                onClick={handleAddNewRegisterHospital}
                                className="w-full text-left px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium border-t border-gray-200 rounded-b-lg transition-colors"
                              >
                                + Add "{registerHospitalQuery.trim()}"
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={handleAddNewRegisterHospital}
                            className="w-full text-left px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg transition-colors"
                          >
                            + Add "{registerHospitalQuery.trim()}"
                          </button>
          )}
        </div>
                    )}
                    {registerFieldErrors.hospital && (
                      <p className="text-xs text-red-600">{registerFieldErrors.hospital}</p>
                    )}
      </div>
                  <select 
                    className="w-full h-10 rounded-2xl border border-gray-300 px-3 text-sm bg-white appearance-none [-webkit-appearance:none] leading-normal"
                    value={registerData.specialty}
                    onChange={(e) => {
                      clearRegisterFieldError('specialty');
                      setRegisterData({...registerData, specialty: e.target.value});
                    }}
                  >
                    <option value="">Select Specialty</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Paediatrics">Paediatrics</option>
                    <option value="Pulmonology">Pulmonology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Gastroenterology">Gastroenterology</option>
                    <option value="Endocrinology">Endocrinology</option>
                    <option value="Nephrology">Nephrology</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Psychiatry">Psychiatry</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="Other">Other</option>
                  </select>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-gray-600">Credentials (e.g. FGCS, FACS, PhD)</label>
                    <div className="flex flex-wrap gap-2">
                      {registerData.credentials.map((credential) => (
                        <span key={credential} className="inline-flex items-center gap-1 rounded-xl bg-blue-50 text-blue-700 px-2 py-1 text-xs">
                          {credential}
                          <button
                            type="button"
                            aria-label={`Remove credential ${credential}`}
                            className="hover:text-blue-900"
                            onClick={() => removeCredential(credential)}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <Input
                      placeholder={registerData.credentials.length ? "Add another credential (press Enter)" : "Add credential (press Enter)"}
                      value={credentialInput}
                      onChange={(e) => {
                        setCredentialInput(e.target.value);
                        clearRegisterFieldError('credentials');
                      }}
                      onKeyDown={handleCredentialKeyDown}
                      className={`h-10 text-sm ${registerFieldErrors.credentials ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    />
                    <p className="text-[10px] text-gray-500">Add up to 10 credentials separated by pressing Enter or comma.</p>
                    {registerFieldErrors.credentials && (
                      <p className="text-xs text-red-600">{registerFieldErrors.credentials}</p>
                    )}
                  </div>
                  <Textarea 
                    placeholder="Bio / specialties (optional)" 
                    rows={2} 
                    className="text-sm" 
                    value={registerData.bio}
                    onChange={(e) => setRegisterData({...registerData, bio: e.target.value})}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                  <p className="text-[10px] text-blue-800 leading-tight">By registering, you attest that you are a licensed medical doctor. All uploads must be de-identified; no patient identifiers.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 justify-end pt-1">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAuthTab("login");
                      setRegisterError("");
                      setRegisterFieldErrors({});
                    }}
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    Back to Login
                  </Button>
                  <Button 
                    onClick={handleRegister} 
                    disabled={authLoading}
                    size="sm" 
                    className="w-full sm:w-auto"
                  >
                    {authLoading ? "Registering..." : "Submit & Continue"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const renderCaseList = () => (
    <>
      {filteredCases.map((c) => (
        <Card key={c.id} className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader
            className="flex justify-between items-start p-2 pb-1"
            onClick={() => setSelectedCase(c)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 flex-wrap">
                <h2 className="font-semibold text-gray-800 text-xs truncate flex-1 min-w-0">
                  {c.title}
                </h2>
                <span className={urgencyBadge(c.urgency)}>{c.urgency}</span>
                {c.closed && (
                  <span className="text-[9px] px-1 py-0.5 rounded-full bg-gray-200 text-gray-600 inline-flex items-center gap-0.5">
                    <Lock size={9} /> Closed
                  </span>
                )}
                <span className="text-[9px] text-gray-400 whitespace-nowrap">
                  {c.time}
                </span>
              </div>
              <div className="flex items-center gap-1 flex-wrap mt-0.5">
                <p className="text-[10px] text-gray-500">
                  {c.author} • {c.specialty} • {(c.authorScore ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
                {c.edited && (
                  <span className="text-[9px] text-gray-400 italic flex items-center gap-0.5">
                    <Edit size={8} />
                    Edited
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2 pt-0.5">
            <div className="flex gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-auto px-1.5"
                disabled={c.closed || votedCases.has(String(c.id))}
                onClick={(e) => {
                  e.stopPropagation();
                  upvoteCase(c.id);
                }}
              >
                <ThumbsUp size={12} />
                <span className="text-[10px] ml-0.5">{c.votes}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-auto px-1.5"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCase(c);
                }}
              >
                <MessageCircle size={12} />
                <span className="text-[10px] ml-0.5">{c.answers.length}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      {hasMore && (
        <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
          {loadingMore ? (
            <div className="text-xs text-gray-400">Loading more cases...</div>
          ) : (
            <div className="text-xs text-gray-400">Scroll for more</div>
          )}
        </div>
      )}
      {!hasMore && filteredCases.length > 0 && (
        <div className="h-10 flex items-center justify-center">
          <div className="text-xs text-gray-400">No more cases to load</div>
        </div>
      )}
    </>
  );

  const handleAnswerAttachmentSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setAnswerAttachmentError('Attachment must be 15MB or smaller.');
      if (answerAttachmentInputRef.current) {
        answerAttachmentInputRef.current.value = '';
      }
      return;
    }

    setAnswerAttachmentError(null);

    if (answerAttachmentPreview) {
      URL.revokeObjectURL(answerAttachmentPreview);
    }

    setAnswerAttachment(file);
    if (file.type.startsWith('image/')) {
      setAnswerAttachmentPreview(URL.createObjectURL(file));
    } else {
      setAnswerAttachmentPreview(null);
    }
  };

  const clearAnswerAttachment = () => {
    if (answerAttachmentPreview) {
      URL.revokeObjectURL(answerAttachmentPreview);
    }
    setAnswerAttachment(null);
    setAnswerAttachmentPreview(null);
    setAnswerAttachmentError(null);
    if (answerAttachmentInputRef.current) {
      answerAttachmentInputRef.current.value = '';
    }
  };

  return (
    <AppLayout
      isAuthed={isAuthed}
      unreadConversations={unreadConversations}
      isAdmin={userProfile.role === "admin" || userProfile.role === "hospital_admin"}
      onHome={handleHomeNav}
      onPost={handlePostNav}
      onAccount={handleAccountNav}
    >
      {/* Mobile Header */}
      <div className="sm:hidden">
      {Header}
      </div>

      <AnimatePresence mode="wait">
        {selectedCase ? (
          <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="sm:max-w-5xl mx-auto px-2 sm:px-0 py-2 space-y-2">
            <div className="bg-white p-2 rounded-xl shadow-sm space-y-1.5">
              <div className="flex items-center justify-between flex-wrap gap-1">
              <div className="flex items-center gap-1 flex-wrap">
                <h2 className="text-sm font-semibold">{selectedCase.title}</h2>
                <span className={urgencyBadge(selectedCase.urgency)}>{selectedCase.urgency}</span>
                  {selectedCase.closed && (
                    <span className="text-[9px] px-1 py-0.5 rounded-full bg-gray-200 text-gray-700 inline-flex items-center gap-0.5">
                      <Lock size={9} /> Closed
                    </span>
                  )}
              </div>
                {isCaseAuthor(selectedCase) && (
                  <div className="flex gap-1">
                    <Button variant="outline" size="icon" onClick={() => startEditCase(selectedCase)} aria-label="Edit">
                      <Edit size={14} />
                    </Button>
                    {!selectedCase.closed && (
                      <Button variant="outline" size="icon" onClick={() => closeCase(selectedCase.id)} aria-label="Close">
                        <Lock size={14} />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 flex-wrap">
              <p className="text-[10px] text-gray-500">
                {selectedCase.author} • {selectedCase.specialty} • {(selectedCase.authorScore ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
                {selectedCase.edited && (
                  <span className="text-[9px] text-gray-400 italic flex items-center gap-0.5">
                    <Edit size={8} />
                    Edited {selectedCase.editedAt}
                  </span>
                )}
              </div>
              {selectedCase.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedCase.tags.map((t) => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700 inline-flex items-center gap-0.5">
                      <Tag size={9} /> {t}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-gray-700 text-xs mt-1 leading-relaxed">{selectedCase.description}</p>

              {selectedCase.media && selectedCase.media.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {selectedCase.media.map((m, idx) => (
                    <a
                      key={idx}
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="media-tile block"
                    >
                      {m.type === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.url} alt="case media" className="w-full h-36 object-cover" />
                      ) : (
                        <video src={m.url} className="w-full h-36 object-cover" controls />
                      )}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-2 rounded-xl shadow-sm space-y-1.5">
              <div className="flex items-center gap-1">
                <MessageCircle className="text-blue-600" size={16} />
              <h3 className="font-semibold text-gray-800 text-xs">Answers</h3>
                <span className="text-[10px] text-gray-500">({selectedCase.answers.length})</span>
              </div>
              {selectedCase.answers.map((a) => {
                const maxVotes = Math.max(...selectedCase.answers.map(ans => ans.votes));
                const isTopAnswer = a.votes === maxVotes && maxVotes > 0;
                return (
                  <Card key={a.id} className={`border ${isTopAnswer ? 'border-yellow-400 bg-yellow-50' : 'border-blue-200 bg-white'} relative`}>
                    {isTopAnswer && (
                      <div className="absolute -top-1.5 -right-1.5 bg-yellow-400 rounded-full p-0.5 shadow-md">
                        <Award size={12} className="text-yellow-900" />
                      </div>
                    )}
                  <CardContent className="p-2 space-y-1">
                      {isTopAnswer && (
                        <div className="flex items-center gap-0.5 text-[10px] font-semibold text-yellow-700 mb-0.5">
                          <Award size={10} />
                          <span>Top Answer</span>
                        </div>
                      )}
                    {a.attachmentUrl && (
                      <div className="mt-0.5">
                        {a.attachmentMimeType?.startsWith('image/') ? (
                          <a
                            href={a.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={a.attachmentUrl}
                              alt={a.attachmentName || 'Answer attachment'}
                              className="max-h-48 rounded-lg object-contain border border-blue-100 transition-transform hover:scale-[1.01]"
                            />
                          </a>
                        ) : (
                          <a
                            href={a.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-semibold hover:bg-blue-200 transition-colors"
                          >
                            📎 {a.attachmentName || 'Download'}
                          </a>
                        )}
                      </div>
                    )}
                    {a.content && (
                      <p className="text-gray-700 text-xs leading-relaxed">{a.content}</p>
                    )}
                    <div className="flex justify-between items-center text-[10px] text-gray-500 flex-wrap gap-1">
                        <span>— {a.author} • {a.specialty} • {a.authorScore?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? '0'}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-auto px-1" disabled={selectedCase.closed || votedAnswers.has(String(a.id))} onClick={() => upvoteAnswer(selectedCase.id, a.id)}>
                        <ThumbsUp size={12} />
                        <span className="text-[10px] ml-0.5">{a.votes}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                );
              })}

              {!selectedCase.closed && (
                <div className="mt-1.5 space-y-2">
                  <h3 className="font-semibold text-gray-800 text-xs">Add Your Answer</h3>
                  <Textarea
                    placeholder={isAuthed ? "Write your answer..." : "Login to answer"}
                    value={newAnswer}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewAnswer(e.target.value)}
                    rows={3}
                    disabled={!isAuthed}
                    className="text-xs leading-relaxed"
                  />
                  {answerAttachment && (
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50/60 px-3 py-2">
                      <div className="flex items-center gap-3">
                        {answerAttachmentPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={answerAttachmentPreview}
                            alt={answerAttachment.name}
                            className="h-12 w-12 rounded-md object-cover border border-blue-200"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-100 text-base">
                            📎
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-blue-900 truncate max-w-[180px]">
                            {answerAttachment.name}
                          </span>
                          <span className="text-[10px] text-blue-700/70">
                            {(answerAttachment.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={clearAnswerAttachment}
                        className="text-blue-700 hover:text-blue-900 transition-colors"
                        aria-label="Remove attachment"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  {answerAttachmentError && (
                    <p className="text-xs text-red-600">{answerAttachmentError}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                  <Button 
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => answerAttachmentInputRef.current?.click()}
                      className="flex items-center gap-2"
                      disabled={!isAuthed}
                    >
                      <Upload size={14} />
                      Add attachment
                    </Button>
                    <input
                      ref={answerAttachmentInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleAnswerAttachmentSelect}
                      accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
                    />
                    <Button
                      size="sm"
                      disabled={!isAuthed || (!newAnswer.trim() && !answerAttachment)}
                    onClick={async () => { 
                        if (!requireAuth() || !selectedCase || (!newAnswer.trim() && !answerAttachment)) return;
                      try {
                          const response = await answersAPI.create(selectedCase.id, {
                            content: newAnswer.trim() || undefined,
                            attachment: answerAttachment || undefined,
                          });
                        const transformedAnswer = {
                          id: response.id,
                            authorId: response.author?.id || response.authorId || undefined,
                            author: response.author
                              ? `${response.author.firstName || ''} ${response.author.lastName || ''}`.trim() || 'Unknown'
                              : 'Unknown',
                          content: response.content,
                          votes: response.votes || 0,
                          specialty: response.author?.specialty || response.specialty || 'Unknown',
                            authorScore: response.author?.score ?? 0,
                            attachmentUrl: response.attachmentUrl || null,
                            attachmentName: response.attachmentName || null,
                            attachmentMimeType: response.attachmentMimeType || null,
                            attachmentSize: response.attachmentSize || null,
                        };
                          setCases((prev) =>
                            prev.map((c) =>
                          c.id === selectedCase.id 
                                ? { ...c, answers: [...c.answers, transformedAnswer].sort((a: { votes: number }, b: { votes: number }) => b.votes - a.votes) }
                                : c,
                            ),
                          );
                        if (selectedCase) {
                            setSelectedCase({
                              ...selectedCase,
                              answers: [...selectedCase.answers, transformedAnswer].sort((a: { votes: number }, b: { votes: number }) => b.votes - a.votes),
                            });
                        }
                          setNewAnswer('');
                          clearAnswerAttachment();
                        } catch (error: any) {
                        console.error('Error submitting answer:', error);
                          let errorMessage = error?.message || error?.error || 'Failed to submit answer. Please try again.';
                          
                          // Include validation details if available
                          if (error?.details && Array.isArray(error.details) && error.details.length > 0) {
                            const validationMessages = error.details.map((detail: any) => detail.msg || detail.message).join('\n');
                            errorMessage = `${errorMessage}\n\n${validationMessages}`;
                          }
                          
                          alert(errorMessage);
                        }
                      }}
                    >
                      Submit
                  </Button>
                </div>
                  {!isAuthed && (
                    <p className="text-xs text-gray-500 mt-1">
                      Login as a verified doctor to submit answers.
                    </p>
                  )}
              </div>
              )}
              {selectedCase.closed && (
                <div className="mt-2 p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Lock size={14} />
                    This case is closed. No new answers are being accepted.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ) : view === "post" ? (
          <motion.div key="post" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="sm:max-w-5xl mx-auto px-3 sm:px-0 py-3 grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-2"><h3 className="font-semibold text-gray-800 text-sm">Post a Case</h3></CardHeader>
                <div className="px-3 pt-0 pb-1.5">
                  <p className="text-[10px] text-gray-500 space-y-0.5">
                    <span className="block">💡 De-identify media before upload. Avoid names, faces, dates, and hospital numbers.</span>
                    <span className="block">💡 Use tags to help specialists find your case quickly.</span>
                  </p>
                </div>
                <CardContent className="space-y-2.5">
                  <select className="w-full h-10 rounded-2xl border border-gray-300 px-3 text-[13px] bg-white appearance-none [-webkit-appearance:none] leading-normal" value={urgency} onChange={(e) => setUrgency(e.target.value as Urgency | "") }>
                      <option value="">Select urgency…</option>
                      <option value="Urgent ongoing case">Urgent ongoing case</option>
                      <option value="Non-urgent ongoing case">Non-urgent ongoing case</option>
                      <option value="Case study">Case study</option>
                    </select>

                  <Input placeholder="Case Title" value={caseTitle} onChange={(e) => setCaseTitle(e.target.value)} className="h-10 text-sm" />
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-gray-700">Case Description</label>
                      <button
                        type="button"
                        onClick={() => setShowSBARExample(true)}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        View Example
                      </button>
                    </div>
                    <Textarea placeholder="Describe your case..." rows={5} value={caseDesc} onChange={(e) => setCaseDesc(e.target.value)} className="text-sm leading-relaxed" />
                  </div>

                  <div>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((t) => (
                        <span key={t} className="inline-flex items-center gap-1 rounded-xl bg-gray-100 px-2 py-1 text-xs">
                          #{t}
                          <button type="button" aria-label={`Remove tag ${t}`} className="hover:text-red-600" onClick={() => removeTag(t)}><X size={12} /></button>
                        </span>
                      ))}
                      <input type="text" placeholder={tags.length ? "Add another tag" : "Add tags (press Enter)"} className="flex-1 min-w-[8rem] h-10 rounded-2xl border border-gray-300 px-2 text-sm bg-white appearance-none [-webkit-appearance:none] leading-normal" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">Max 8 tags. Use Enter or comma to add. Examples: cardiology, pneumonia, ecg.</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-gray-700">Attach Images/Videos</label>
                      <Button size="sm" variant="ghost" onClick={() => setBlurOn(v => !v)}>
                        {blurOn ? <><EyeOff className="mr-1" size={14}/>Blur: ON</> : <><Eye className="mr-1" size={14}/>Blur: OFF</>}
                      </Button>
                    </div>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      multiple 
                      accept="image/*,video/*" 
                      capture
                      onChange={(e) => handleFiles(e.target.files)} 
                      className="hidden" 
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-10 sm:h-11 flex items-center justify-center gap-2 border border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation text-sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={18} className="sm:w-5 sm:h-5" />
                      <span className="text-sm sm:text-base font-medium">
                        {mediaFiles.length > 0 ? `${mediaFiles.length} file${mediaFiles.length > 1 ? 's' : ''} selected` : 'Choose Files'}
                      </span>
                    </Button>
                    {mediaFiles.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {mediaFiles.map((m, idx) => (
                          <div key={idx} className="media-tile">
                            {m.type === "image" ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={m.url} alt="preview" className={`w-full h-24 object-cover ${blurOn ? "media-blur" : ""}`} />
                            ) : (
                              <video src={m.url} className={`w-full h-24 object-cover ${blurOn ? "media-blur" : ""}`} />
                            )}
                            <button className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-[10px]" onClick={() => removeMedia(m.url)}><X size={10}/></button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg p-2">
                      Face-blur is a <strong>visual stub</strong> for de-identification. For production, run server-side redaction (e.g., automatic face/PHI detection) before storing media.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button size="sm" fullWidth disabled={!canSubmitCase} onClick={submitCase} className="h-10"><Send size={16} className="mr-1" /> Submit</Button>
                    <Button size="sm" fullWidth variant="ghost" onClick={() => { setView("feed"); }} className="h-10">Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        ) : (
          <motion.main key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="sm:max-w-5xl mx-auto px-3 sm:px-0 py-2">
            <div className="bg-white rounded-2xl shadow-sm">
              <button className="w-full flex items-center justify-between px-3 py-1.5 tap sm:cursor-default" onClick={() => setFiltersOpen(o => !o)}>
                <div className="flex items-center gap-1.5 text-[13px] font-medium text-gray-700"><Filter size={15}/> Search & Filters</div>
                <span className="text-[11px] text-gray-500 sm:hidden">{filtersOpen ? "Hide" : "Show"}</span>
              </button>
              <AnimatePresence initial={false}>
                {(filtersOpen || typeof window !== 'undefined' && window.innerWidth >= 640) && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-3 pb-2.5 space-y-2.5">
                    <div>
                      <Input 
                        placeholder="Search cases, authors, specialties..." 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700 whitespace-nowrap">Urgency:</span>
                      <select className="h-10 rounded-xl border border-gray-300 px-2 text-sm bg-white w-full" value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value as any)}>
                        <option value="All">All</option>
                        <option value="Urgent ongoing case">Urgent ongoing case</option>
                        <option value="Non-urgent ongoing case">Non-urgent ongoing case</option>
                        <option value="Case study">Case study</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={openCasesOnly}
                          onChange={(e) => setOpenCasesOnly(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Open cases only</span>
                      </label>
                    </div>
                      <div className="sm:col-span-1">
                        <span className="text-sm text-gray-700 block mb-1">Tags:</span>
                        {tagFilters.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {tagFilters.map(tag => (
                              <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 px-2 py-1 text-xs">
                                #{tag}
                                <button 
                                  type="button" 
                                  aria-label={`Remove tag ${tag}`} 
                                  className="hover:text-blue-900" 
                                  onClick={() => removeTagFilter(tag)}
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        <input 
                          className="h-10 rounded-xl border border-gray-300 px-2 text-sm bg-white w-full" 
                          placeholder="Add tag (press Enter)" 
                          value={filterTagInput} 
                          onChange={(e) => setFilterTagInput(e.target.value)} 
                          onKeyDown={handleTagFilterKeyDown}
                          list="tag-suggestions" 
                        />
                      <datalist id="tag-suggestions">{allTags.map(t => (<option value={t} key={t} />))}</datalist>
                    </div>
                    </div>
                    {(searchQuery || urgencyFilter !== "All" || tagFilters.length > 0 || openCasesOnly) && (
                      <div className="flex justify-end">
                        <Button size="sm" variant="ghost" onClick={() => { setSearchQuery(""); setUrgencyFilter("All"); setTagFilters([]); setFilterTagInput(""); setOpenCasesOnly(false); }}>Clear All</Button>
                      </div>
                    )}
                    {allTags.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {allTags.slice(0,12).map(t => {
                          const isSelected = tagFilters.includes(t.toLowerCase());
                          return (
                            <button 
                              key={t} 
                              className={`text-xs px-2 py-1 rounded-full border tap ${
                                isSelected 
                                  ? "bg-blue-100 border-blue-300 text-blue-700" 
                                  : "border-gray-300 hover:bg-gray-50"
                              }`} 
                              onClick={() => isSelected ? removeTagFilter(t.toLowerCase()) : addTagFilter(t)}
                            >
                              #{t}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Tabs
              value={activeCaseTab}
              onValueChange={(val) => setActiveCaseTab(val as 'feed' | 'recent')}
              className="mt-2"
            >
              <TabsList className="h-9 gap-1">
                <TabsTrigger value="feed" className="px-3 py-1 text-[13px]">Trending</TabsTrigger>
                <TabsTrigger value="recent" className="px-3 py-1 text-[13px]">Recent</TabsTrigger>
              </TabsList>

              <TabsContent value="feed" className="space-y-2 mt-2">
                {renderCaseList()}
              </TabsContent>
              <TabsContent value="recent" className="space-y-2 mt-2">
                {renderCaseList()}
              </TabsContent>
            </Tabs>
          </motion.main>
        )}
      </AnimatePresence>

      {/* Profile Dialog */}
      <Dialog open={showProfile} onOpenChange={(open: boolean) => setShowProfile(open)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Profile</DialogTitle>
          </DialogHeader>
          {!editingProfile ? (
            <div className="space-y-3 mt-1.5">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  {userProfile.profilePicture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={userProfile.profilePicture} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-gray-200" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-blue-500 text-white flex items-center justify-center text-2xl font-bold border-2 border-gray-200">
                      {userProfile.firstName[0]}{userProfile.lastName[0]}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-800">{userProfile.firstName} {userProfile.lastName}</h3>
                  {userProfile.credentials && userProfile.credentials.length > 0 && (
                    <p className="text-xs text-blue-700 font-medium mt-1">
                      {userProfile.credentials.join(', ')}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">{userProfile.specialty}</p>
                  <p className="text-xs text-gray-400 mt-1">{userProfile.hospital}</p>
                </div>
              </div>

              <div className="bg-blue-50/40 border border-blue-100 rounded px-3 py-2 max-w-md">
                <div className="flex items-center gap-2 text-blue-700">
                  <Award className="text-blue-400" size={14} />
                  <span className="text-[11px] font-medium uppercase tracking-wide">Impact Score</span>
                  <span className="text-sm font-semibold text-blue-600">
                    {(userProfile.score ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                  </div>
                {userProfile.bio && (
                  <p className="mt-2 text-sm text-gray-700 leading-snug whitespace-pre-line">
                    {userProfile.bio}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-gray-600">
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <p className="font-semibold text-gray-700">Email</p>
                  <p className="mt-1 break-words text-sm">{userProfile.email}</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <p className="font-semibold text-gray-700">Phone</p>
                  <p className="mt-1 text-sm">{userProfile.phoneNumber || "Not provided"}</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <p className="font-semibold text-gray-700">Hospital</p>
                  <p className="mt-1 text-sm">{userProfile.hospital || "—"}</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <p className="font-semibold text-gray-700">Specialty</p>
                  <p className="mt-1 text-sm">{userProfile.specialty || "—"}</p>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button onClick={startEditProfile} className="w-full sm:w-auto">
                  <Edit size={16} className="mr-2" /> Edit Profile
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleLogout} 
                  className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <LogOut size={16} className="mr-2" /> Logout
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-3 mt-1.5">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  {profileEditData.profilePicture || userProfile.profilePicture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profileEditData.profilePicture || userProfile.profilePicture} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-gray-200" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-blue-500 text-white flex items-center justify-center text-2xl font-bold border-2 border-gray-200">
                      {userProfile.firstName[0]}{userProfile.lastName[0]}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => profilePictureInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 transition-colors"
                    title="Change profile picture"
                  >
                    <Camera size={16} />
                  </button>
                  <input
                    ref={profilePictureInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Title</label>
                  <select
                    className="w-full h-10 rounded-2xl border border-gray-300 px-3 text-sm bg-white appearance-none [-webkit-appearance:none] leading-normal mt-1"
                    value={profileEditData.title}
                    onChange={(e) => setProfileEditData(prev => ({ ...prev, title: e.target.value }))}
                  >
                    <option value="Dr (Med)">Dr (Med)</option>
                    <option value="Prof.">Prof.</option>
                    <option value="Dr (Den)">Dr (Den)</option>
                    <option value="Dr (Opt)">Dr (Opt)</option>
                    <option value="Dr.">Dr.</option>
                    <option value="Mr.">Mr.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Miss">Miss</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Email</label>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={profileEditData.email}
                    onChange={(e) => setProfileEditData(prev => ({ ...prev, email: e.target.value }))}
                    className="h-10 text-sm mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Phone Number</label>
                  <Input
                    type="tel"
                    placeholder="Phone Number"
                    value={profileEditData.phoneNumber}
                    onChange={(e) => handleProfilePhoneInputChange(e.target.value)}
                    className="h-10 text-sm mt-1"
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Show phone number on doctors list</label>
                    <p className="text-[10px] text-gray-500 mt-0.5">Allow other doctors to see your phone number</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={profileEditData.showPhone}
                    onChange={(e) => setProfileEditData(prev => ({ ...prev, showPhone: e.target.checked }))}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Show email on doctors list</label>
                    <p className="text-[10px] text-gray-500 mt-0.5">Allow other doctors to see your email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={profileEditData.showEmail}
                    onChange={(e) => setProfileEditData(prev => ({ ...prev, showEmail: e.target.checked }))}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">New Password (leave blank to keep current)</label>
                  <Input
                    type="password"
                    placeholder="New Password"
                    value={profileEditData.password}
                    onChange={(e) => setProfileEditData(prev => ({ ...prev, password: e.target.value }))}
                    className="h-10 text-sm mt-1"
                  />
                </div>
                {profileEditData.password && (
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Confirm New Password</label>
                    <Input
                      type="password"
                      placeholder="Confirm Password"
                      value={profileEditData.confirmPassword}
                      onChange={(e) => setProfileEditData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="h-10 text-sm mt-1"
                    />
                  </div>
                )}
                <div className="relative">
                  <label className="text-xs font-semibold text-gray-700">Hospital/Institution</label>
                  <Input
                    ref={hospitalInputRef}
                    placeholder="Search or type hospital name..."
                    value={hospitalSearchQuery}
                    onChange={(e) => handleHospitalInputChange(e.target.value)}
                    onFocus={() => setShowHospitalSuggestions(true)}
                    onBlur={handleHospitalInputBlur}
                    className="h-10 text-sm mt-1"
                  />
                  {showHospitalSuggestions && hospitalSearchQuery.trim() && (
                    <div
                      ref={hospitalSuggestionsRef}
                      className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {filteredHospitals.length > 0 ? (
                        <>
                          {filteredHospitals.map((hospital, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleHospitalSelect(hospital)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors first:rounded-t-lg last:rounded-b-lg"
                            >
                              {hospital}
                            </button>
                          ))}
                          {!filteredHospitals.includes(hospitalSearchQuery.trim()) && (
                            <button
                              type="button"
                              onClick={handleAddNewHospital}
                              className="w-full text-left px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium border-t border-gray-200 rounded-b-lg transition-colors"
                            >
                              + Add "{hospitalSearchQuery.trim()}"
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={handleAddNewHospital}
                          className="w-full text-left px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg transition-colors"
                        >
                          + Add "{hospitalSearchQuery.trim()}"
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Specialty</label>
                  <select
                    className="w-full h-10 rounded-2xl border border-gray-300 px-3 text-sm bg-white appearance-none [-webkit-appearance:none] leading-normal mt-1"
                    value={profileEditData.specialty}
                    onChange={(e) => setProfileEditData(prev => ({ ...prev, specialty: e.target.value }))}
                  >
                    <option value="">Select Specialty</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Paediatrics">Paediatrics</option>
                    <option value="Pulmonology">Pulmonology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Gastroenterology">Gastroenterology</option>
                    <option value="Endocrinology">Endocrinology</option>
                    <option value="Nephrology">Nephrology</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Psychiatry">Psychiatry</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Credentials</label>
                  <div className="flex flex-wrap gap-2">
                    {(profileEditData.credentials || []).map((credential) => (
                      <span key={credential} className="inline-flex items-center gap-1 rounded-xl bg-blue-50 text-blue-700 px-2 py-1 text-xs">
                        {credential}
                        <button
                          type="button"
                          aria-label={`Remove credential ${credential}`}
                          className="hover:text-blue-900"
                          onClick={() => removeProfileCredential(credential)}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <Input
                    placeholder={(profileEditData.credentials?.length || 0) ? "Add another credential (press Enter)" : "Add credential (press Enter)"}
                    value={profileCredentialInput}
                    onChange={(e) => setProfileCredentialInput(e.target.value)}
                    onKeyDown={handleProfileCredentialKeyDown}
                    className="h-10 text-sm"
                  />
                  <p className="text-[11px] text-gray-500">Add up to 10 credentials.</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Bio</label>
                  <Textarea
                    placeholder="Share a short bio or areas of expertise"
                    rows={3}
                    className="text-sm mt-1"
                    value={profileEditData.bio}
                    onChange={(e) => setProfileEditData(prev => ({ ...prev, bio: e.target.value }))}
                  />
                  <p className="text-[11px] text-gray-500">Optional. This appears with your impact score.</p>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" onClick={cancelEditProfile} className="w-full sm:w-auto">Cancel</Button>
                <Button 
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Only check password match if password is being changed
                    if (profileEditData.password) {
                      if (profileEditData.password !== profileEditData.confirmPassword) {
                        alert('Passwords do not match. Please make sure both password fields match.');
                        return;
                      }
                    }
                    
                    await saveProfile();
                  }} 
                  className="w-full sm:w-auto"
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={(open: boolean) => { if (!open) cancelEditCase(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Case</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <Input 
              placeholder="Case Title" 
              value={editTitle} 
              onChange={(e) => setEditTitle(e.target.value)} 
            />
            <Textarea 
              placeholder="Describe your case..." 
              rows={6} 
              value={editDesc} 
              onChange={(e) => setEditDesc(e.target.value)} 
            />
            <div>
              <label className="text-xs font-semibold text-gray-700">Urgency</label>
              <select 
                className="mt-1 w-full h-11 rounded-2xl border border-gray-300 px-3 text-sm bg-white" 
                value={editUrgency} 
                onChange={(e) => setEditUrgency(e.target.value as Urgency | "")}
              >
                <option value="">Select urgency…</option>
                <option value="Urgent ongoing case">Urgent ongoing case</option>
                <option value="Non-urgent ongoing case">Non-urgent ongoing case</option>
                <option value="Case study">Case study</option>
              </select>
              </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={cancelEditCase}>Cancel</Button>
            <Button onClick={saveEditCase} disabled={!editTitle.trim() || !editDesc.trim() || !editUrgency}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SBAR Example Dialog */}
      <Dialog open={showSBARExample} onOpenChange={setShowSBARExample}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">SBAR Format Example</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-gray-600">
              SBAR (Situation, Background, Assessment, Recommendation/Request) is a structured communication format used in healthcare. Here's an example:
            </p>
            
            <div className="space-y-3 text-xs">
              <div className="border-l-4 border-blue-500 pl-3 py-2 bg-blue-50/50 rounded-r">
                <h4 className="font-semibold text-gray-900 mb-1">Situation</h4>
                <p className="text-gray-700 leading-relaxed">
                  45-year-old male with acute onset crushing chest pain, radiating to left arm. Pain started 2 hours ago at rest, rated 8/10.
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-3 py-2 bg-green-50/50 rounded-r">
                <h4 className="font-semibold text-gray-900 mb-1">Background</h4>
                <p className="text-gray-700 leading-relaxed">
                  History: hypertension, hyperlipidemia. Family history: father with MI at age 50. ECG: ST elevation in II, III, aVF. Troponin I: 2.5 ng/mL. BP: 150/95, HR: 95, SpO2: 96%.
                </p>
              </div>

              <div className="border-l-4 border-amber-500 pl-3 py-2 bg-amber-50/50 rounded-r">
                <h4 className="font-semibold text-gray-900 mb-1">Assessment</h4>
                <p className="text-gray-700 leading-relaxed">
                  Acute inferior STEMI. Patient hemodynamically stable but requires urgent intervention.
                </p>
              </div>

              <div className="border-l-4 border-purple-500 pl-3 py-2 bg-purple-50/50 rounded-r">
                <h4 className="font-semibold text-gray-900 mb-1">Recommendation/Request</h4>
                <p className="text-gray-700 leading-relaxed">
                  Immediate transfer to cardiac catheterization lab for primary PCI. Patient received aspirin 325mg and clopidogrel 600mg. Ready for transfer. What is the best approach for managing this patient's STEMI? Should we proceed with primary PCI or consider thrombolytic therapy?
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-[10px] text-gray-600 leading-relaxed">
                <strong className="text-gray-800">Tips for using SBAR:</strong>
              </p>
              <ul className="text-[10px] text-gray-600 mt-1.5 space-y-1 list-disc list-inside">
                <li><strong>Situation:</strong> Clearly state what is happening right now</li>
                <li><strong>Background:</strong> Provide relevant clinical history, vital signs, and test results</li>
                <li><strong>Assessment:</strong> Share your clinical judgment and what you think the problem is</li>
                <li><strong>Recommendation/Request:</strong> State what action you recommend and what guidance or help you need</li>
              </ul>
            </div>

            <DialogFooter>
              <Button onClick={() => setShowSBARExample(false)} size="sm" className="h-8 text-xs">
                Close
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
