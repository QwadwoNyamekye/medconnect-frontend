'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppLayout } from '@/components/layout/AppLayout';
import { adminAPI, authAPI, hospitalsAPI, type Hospital } from '@/lib/api';
import { Shield, Mail, Edit2, Eye, EyeOff, Trash2, Lock, Building2, Plus, X, MapPin, Phone, Mail as MailIcon, Globe, Users, Calendar, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  hospital?: string;
  specialty?: string;
  title?: string;
  phoneNumber?: string;
  country?: string;
  licenseNumber?: string;
  credentials?: string[];
  bio?: string;
  showPhone?: boolean;
  showEmail?: boolean;
}

export default function AdminPage() {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isHospitalAdmin, setIsHospitalAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('hospitals');
  
  // Hospitals management
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [hospitalsSearch, setHospitalsSearch] = useState('');
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [editHospitalDialog, setEditHospitalDialog] = useState<{ open: boolean; hospital: Hospital | null }>({ open: false, hospital: null });
  const [newHospitalDialog, setNewHospitalDialog] = useState(false);
  const [hospitalFormData, setHospitalFormData] = useState<Partial<Hospital>>({
    name: '',
    country: '',
    level: 'primary',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: '',
    region: '',
    latitude: null,
    longitude: null,
    bedCapacity: 0,
    services: {
      clinics: [],
      inPatient: [],
      labsAndImaging: [],
      special: [],
    },
    clinicSchedules: [],
  });
  const [newService, setNewService] = useState({ type: 'clinics', value: '' });
  const [newSchedule, setNewSchedule] = useState({ clinicName: '', days: '', time: '', doctor: '', notes: '' });
  
  // Users management
  const [users, setUsers] = useState<User[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);
  
  // Messages management
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesPage, setMessagesPage] = useState(1);
  const [messagesSearch, setMessagesSearch] = useState('');
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesSubTab, setMessagesSubTab] = useState<'messages' | 'answers'>('messages');
  
  // Answers management
  const [answers, setAnswers] = useState<any[]>([]);
  const [answersPage, setAnswersPage] = useState(1);
  const [answersSearch, setAnswersSearch] = useState('');
  const [answersLoading, setAnswersLoading] = useState(false);
  
  // Edit dialogs
  const [editMessageDialog, setEditMessageDialog] = useState<{ open: boolean; message: any | null }>({ open: false, message: null });
  const [editMessageContent, setEditMessageContent] = useState('');
  const [editAnswerDialog, setEditAnswerDialog] = useState<{ open: boolean; answer: any | null }>({ open: false, answer: null });
  const [editAnswerContent, setEditAnswerContent] = useState('');
  
  // Dialogs
  const [resetPasswordDialog, setResetPasswordDialog] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [newPassword, setNewPassword] = useState('');
  const [deleteUserDialog, setDeleteUserDialog] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [editUserDialog, setEditUserDialog] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [editUserData, setEditUserData] = useState<Partial<User>>({});
  const [editUserCredentialInput, setEditUserCredentialInput] = useState('');
  const [broadcastDialog, setBroadcastDialog] = useState(false);
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await authAPI.getMe();
        if (user?.id) {
          setCurrentUser(user);
          setIsAuthed(true);
          setIsAdmin(user.role === 'admin');
          setIsHospitalAdmin(user.role === 'hospital_admin');
          if (user.role !== 'admin' && user.role !== 'hospital_admin') {
            router.push('/');
          }
          // Set default tab based on role
          if (user.role === 'hospital_admin') {
            setActiveTab('hospitals');
          }
        } else {
          router.push('/');
        }
      } catch (error) {
        router.push('/');
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if ((isAdmin || isHospitalAdmin) && activeTab === 'hospitals') {
      fetchHospitals();
    } else if (isAdmin && activeTab === 'users') {
      fetchUsers();
    } else if (isAdmin && activeTab === 'content' && messagesSubTab === 'messages') {
      fetchMessages();
    } else if (isAdmin && activeTab === 'content' && messagesSubTab === 'answers') {
      fetchAnswers();
    }
  }, [isAdmin, isHospitalAdmin, activeTab, usersPage, usersSearch, messagesPage, messagesSearch, answersPage, answersSearch, messagesSubTab, hospitalsSearch]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await adminAPI.getAllUsers(usersPage, 20, usersSearch || undefined);
      setUsers(response.users || []);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      alert(error.message || 'Failed to fetch users');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchMessages = async () => {
    setMessagesLoading(true);
    try {
      const response = await adminAPI.getAllMessages(messagesPage, 20, messagesSearch || undefined);
      setMessages(response.messages || []);
    } catch (error: any) {
      console.error('Failed to fetch messages:', error);
      alert(error.message || 'Failed to fetch messages');
    } finally {
      setMessagesLoading(false);
    }
  };

  const fetchAnswers = async () => {
    setAnswersLoading(true);
    try {
      const response = await adminAPI.getAllAnswers(answersPage, 20, answersSearch || undefined);
      setAnswers(response.answers || []);
    } catch (error: any) {
      console.error('Failed to fetch answers:', error);
      alert(error.message || 'Failed to fetch answers');
    } finally {
      setAnswersLoading(false);
    }
  };

  const fetchHospitals = async () => {
    setHospitalsLoading(true);
    try {
      const data = await hospitalsAPI.getAll({ search: hospitalsSearch || undefined });
      setHospitals(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to fetch hospitals:', error);
      alert(error.message || 'Failed to fetch hospitals');
    } finally {
      setHospitalsLoading(false);
    }
  };

  const handleCreateHospital = async () => {
    if (!hospitalFormData.name?.trim()) {
      alert('Hospital name is required');
      return;
    }
    setLoading(true);
    try {
      await hospitalsAPI.create(hospitalFormData);
      alert('Hospital created successfully');
      setNewHospitalDialog(false);
      resetHospitalForm();
      fetchHospitals();
    } catch (error: any) {
      alert(error.message || 'Failed to create hospital');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateHospital = async () => {
    const hospital = editHospitalDialog.hospital;
    if (!hospital || !hospitalFormData.name?.trim()) {
      alert('Hospital name is required');
      return;
    }
    setLoading(true);
    try {
      await hospitalsAPI.update(hospital.id, hospitalFormData);
      alert('Hospital updated successfully');
      setEditHospitalDialog({ open: false, hospital: null });
      resetHospitalForm();
      fetchHospitals();
    } catch (error: any) {
      alert(error.message || 'Failed to update hospital');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHospital = async (hospitalId: string) => {
    if (!confirm('Are you sure you want to delete this hospital? This action cannot be undone.')) return;
    setLoading(true);
    try {
      await hospitalsAPI.delete(hospitalId);
      alert('Hospital deleted successfully');
      fetchHospitals();
    } catch (error: any) {
      alert(error.message || 'Failed to delete hospital');
    } finally {
      setLoading(false);
    }
  };

  const resetHospitalForm = () => {
    setHospitalFormData({
      name: '',
      country: '',
      level: 'primary',
      phone: '',
      email: '',
      website: '',
      address: '',
      city: '',
      region: '',
      latitude: null,
      longitude: null,
      bedCapacity: 0,
      services: {
        clinics: [],
        inPatient: [],
        labsAndImaging: [],
        special: [],
      },
      clinicSchedules: [],
    });
    setNewService({ type: 'clinics', value: '' });
    setNewSchedule({ clinicName: '', days: '', time: '', doctor: '', notes: '' });
  };

  const openEditHospital = (hospital: Hospital) => {
    setHospitalFormData({
      name: hospital.name,
      country: hospital.country,
      level: hospital.level,
      phone: hospital.phone,
      email: hospital.email,
      website: hospital.website,
      address: hospital.address,
      city: hospital.city,
      region: hospital.region,
      latitude: hospital.latitude,
      longitude: hospital.longitude,
      bedCapacity: hospital.bedCapacity,
      services: hospital.services || {
        clinics: [],
        inPatient: [],
        labsAndImaging: [],
        special: [],
      },
      clinicSchedules: hospital.clinicSchedules || [],
    });
    setEditHospitalDialog({ open: true, hospital });
  };

  const addService = () => {
    if (!newService.value.trim()) return;
    const serviceType = newService.type as keyof typeof hospitalFormData.services;
    const currentServices = hospitalFormData.services?.[serviceType] || [];
    const currentServicesObj = hospitalFormData.services || {
      clinics: [],
      inPatient: [],
      labsAndImaging: [],
      special: [],
    };
    setHospitalFormData({
      ...hospitalFormData,
      services: {
        clinics: currentServicesObj.clinics || [],
        inPatient: currentServicesObj.inPatient || [],
        labsAndImaging: currentServicesObj.labsAndImaging || [],
        special: currentServicesObj.special || [],
        [serviceType]: [...currentServices, newService.value.trim()],
      },
    });
    setNewService({ type: 'clinics', value: '' });
  };

  const removeService = (type: keyof typeof hospitalFormData.services, index: number) => {
    const currentServices = hospitalFormData.services?.[type] || [];
    const currentServicesObj = hospitalFormData.services || {
      clinics: [],
      inPatient: [],
      labsAndImaging: [],
      special: [],
    };
    setHospitalFormData({
      ...hospitalFormData,
      services: {
        clinics: currentServicesObj.clinics || [],
        inPatient: currentServicesObj.inPatient || [],
        labsAndImaging: currentServicesObj.labsAndImaging || [],
        special: currentServicesObj.special || [],
        [type]: currentServices.filter((_, i) => i !== index),
      },
    });
  };

  const addSchedule = () => {
    if (!newSchedule.clinicName.trim() || !newSchedule.days.trim() || !newSchedule.time.trim()) {
      alert('Clinic name, days, and time are required');
      return;
    }
    const daysArray = newSchedule.days.split(',').map(d => d.trim()).filter(Boolean);
    const schedules = hospitalFormData.clinicSchedules || [];
    setHospitalFormData({
      ...hospitalFormData,
      clinicSchedules: [
        ...schedules,
        {
          clinicName: newSchedule.clinicName.trim(),
          days: daysArray,
          time: newSchedule.time.trim(),
          doctor: newSchedule.doctor.trim() || undefined,
          notes: newSchedule.notes.trim() || undefined,
        },
      ],
    });
    setNewSchedule({ clinicName: '', days: '', time: '', doctor: '', notes: '' });
  };

  const removeSchedule = (index: number) => {
    const schedules = hospitalFormData.clinicSchedules || [];
    setHospitalFormData({
      ...hospitalFormData,
      clinicSchedules: schedules.filter((_, i) => i !== index),
    });
  };

  const handleResetPassword = async () => {
    const user = resetPasswordDialog.user;
    if (!user || !newPassword) return;
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await adminAPI.resetPassword(user.id, newPassword);
      alert('Password reset successfully');
      setResetPasswordDialog({ open: false, user: null });
      setNewPassword('');
    } catch (error: any) {
      console.error('Reset password error:', error);
      alert(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    const user = editUserDialog.user;
    if (!user) return;

    setLoading(true);
    try {
      await adminAPI.updateUser(user.id, {
        ...editUserData,
        role: editUserData.role as 'doctor' | 'admin' | 'hospital_admin' | undefined,
      });
      alert('User updated successfully');
      setEditUserDialog({ open: false, user: null });
      setEditUserData({});
      setEditUserCredentialInput('');
      fetchUsers();
    } catch (error: any) {
      alert(error.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const openEditUser = (user: User) => {
    setEditUserData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      title: user.title || 'Dr.',
      phoneNumber: user.phoneNumber || '',
      country: user.country || '',
      hospital: user.hospital || '',
      specialty: user.specialty || '',
      licenseNumber: user.licenseNumber || '',
      credentials: user.credentials || [],
      bio: user.bio || '',
      role: user.role as 'doctor' | 'admin' | 'hospital_admin',
      showPhone: user.showPhone !== undefined ? user.showPhone : true,
      showEmail: user.showEmail !== undefined ? user.showEmail : true,
    });
    setEditUserDialog({ open: true, user });
  };

  const addEditUserCredential = () => {
    if (!editUserCredentialInput.trim()) return;
    setEditUserData({
      ...editUserData,
      credentials: [...(editUserData.credentials || []), editUserCredentialInput.trim()],
    });
    setEditUserCredentialInput('');
  };

  const removeEditUserCredential = (index: number) => {
    const credentials = editUserData.credentials || [];
    setEditUserData({
      ...editUserData,
      credentials: credentials.filter((_, i) => i !== index),
    });
  };

  const handleDeleteUser = async () => {
    const user = deleteUserDialog.user;
    if (!user) {
      console.error('No user selected for deletion');
      return;
    }
    
    // Confirmation
    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.email}?\n\nThis action cannot be undone and will permanently remove:\n- User account\n- All associated cases\n- All associated answers\n- All messages and conversations`
    );
    
    if (!confirmed) {
      return;
    }
    
    setLoading(true);
    try {
      console.log('Attempting to delete user:', user.id, user.email);
      const response = await adminAPI.deleteUser(user.id);
      console.log('Delete user response:', response);
      alert('User deleted successfully');
      setDeleteUserDialog({ open: false, user: null });
      // Refresh the user list
      await fetchUsers();
    } catch (error: any) {
      console.error('Delete user error:', error);
      const errorMessage = error?.message || error?.error || 'Failed to delete user';
      alert(`Error: ${errorMessage}\n\nThis might be because:\n- The user is an admin account\n- You're trying to delete your own account\n- There are database constraints preventing deletion`);
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastContent.trim()) {
      alert('Message content is required');
      return;
    }
    setLoading(true);
    try {
      await adminAPI.broadcastMessage(broadcastContent, broadcastTitle || undefined);
      alert('Message broadcasted successfully');
      setBroadcastDialog(false);
      setBroadcastContent('');
      setBroadcastTitle('');
    } catch (error: any) {
      alert(error.message || 'Failed to broadcast message');
    } finally {
      setLoading(false);
    }
  };

  const handleEditMessage = async () => {
    const message = editMessageDialog.message;
    if (!message || !editMessageContent.trim()) return;
    setLoading(true);
    try {
      await adminAPI.editMessage(message.id, editMessageContent);
      alert('Message updated successfully');
      setEditMessageDialog({ open: false, message: null });
      setEditMessageContent('');
      fetchMessages();
    } catch (error: any) {
      alert(error.message || 'Failed to update message');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMessageVisibility = async (messageId: string, currentlyHidden: boolean) => {
    setLoading(true);
    try {
      await adminAPI.toggleMessageVisibility(messageId, !currentlyHidden);
      fetchMessages();
    } catch (error: any) {
      alert(error.message || 'Failed to toggle message visibility');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    setLoading(true);
    try {
      await adminAPI.deleteMessage(messageId);
      alert('Message deleted successfully');
      fetchMessages();
    } catch (error: any) {
      alert(error.message || 'Failed to delete message');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAnswer = async () => {
    const answer = editAnswerDialog.answer;
    if (!answer || !editAnswerContent.trim()) return;
    setLoading(true);
    try {
      await adminAPI.editAnswer(answer.id, editAnswerContent);
      alert('Answer updated successfully');
      setEditAnswerDialog({ open: false, answer: null });
      setEditAnswerContent('');
      fetchAnswers();
    } catch (error: any) {
      alert(error.message || 'Failed to update answer');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAnswerVisibility = async (answerId: string, currentlyHidden: boolean) => {
    setLoading(true);
    try {
      await adminAPI.toggleAnswerVisibility(answerId, !currentlyHidden);
      fetchAnswers();
    } catch (error: any) {
      alert(error.message || 'Failed to toggle answer visibility');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnswer = async (answerId: string) => {
    if (!confirm('Are you sure you want to delete this answer?')) return;
    setLoading(true);
    try {
      await adminAPI.deleteAnswer(answerId);
      alert('Answer deleted successfully');
      fetchAnswers();
    } catch (error: any) {
      alert(error.message || 'Failed to delete answer');
    } finally {
      setLoading(false);
    }
  };

  const handleHomeNav = () => {
    router.push('/');
  };

  const handlePostNav = () => {
    router.push('/');
    // The post view will be available on the home page
  };

  const handleAccountNav = () => {
    localStorage.setItem('medconnect-open-profile', 'true');
    window.dispatchEvent(new Event('medconnect-open-profile'));
    router.push('/');
  };

  if (!isAdmin && !isHospitalAdmin) {
    return null;
  }

  return (
    <AppLayout
      isAuthed={isAuthed}
      unreadConversations={0}
      isAdmin={isAdmin || isHospitalAdmin}
      onHome={handleHomeNav}
      onPost={handlePostNav}
      onAccount={handleAccountNav}
    >
      {/* Mobile Header */}
      <div className="sm:hidden">
        <AppHeader />
      </div>
      <div className="sm:max-w-4xl mx-auto px-2 sm:px-0 py-2">
        <div className="flex items-center gap-1.5 mb-3">
          <Shield className="w-5 h-5 text-blue-600" />
          <h1 className="text-sm font-bold text-gray-900">Admin Panel</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${isHospitalAdmin ? 'grid-cols-1' : 'grid-cols-4'}`}>
            {!isHospitalAdmin && <TabsTrigger value="users">Users</TabsTrigger>}
            <TabsTrigger value="hospitals">Hospitals</TabsTrigger>
            {!isHospitalAdmin && <TabsTrigger value="content">Content</TabsTrigger>}
            {!isHospitalAdmin && <TabsTrigger value="broadcast">Broadcast</TabsTrigger>}
          </TabsList>

          <TabsContent value="users" className="mt-4">
            <div className="bg-white rounded-xl shadow-sm p-2">
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Search users..."
                  value={usersSearch}
                  onChange={(e) => {
                    setUsersSearch(e.target.value);
                    setUsersPage(1);
                  }}
                  className="flex-1"
                />
              </div>
              
              {usersLoading ? (
                <div className="text-center py-8 text-gray-500">Loading users...</div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No users found</div>
              ) : (
                <div className="space-y-2">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 border rounded-lg">
                      <div className="flex-1">
                        <div className="text-xs font-medium">{user.firstName} {user.lastName}</div>
                        <div className="text-[10px] text-gray-500">{user.email}</div>
                        {user.hospital && <div className="text-[9px] text-gray-400">{user.hospital}</div>}
                        {user.role === 'admin' && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[9px] bg-blue-100 text-blue-700 rounded">Admin</span>
                        )}
                        {user.role === 'hospital_admin' && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[9px] bg-green-100 text-green-700 rounded">Hospital Admin</span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => openEditUser(user)}
                          aria-label="Edit User"
                        >
                          <Edit2 size={12} />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => setResetPasswordDialog({ open: true, user })}
                          aria-label="Reset Password"
                        >
                          <Lock size={12} />
                        </Button>
                        {user.id !== currentUser?.id && (
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => setDeleteUserDialog({ open: true, user })}
                            aria-label="Delete"
                          >
                            <Trash2 size={12} />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="content" className="mt-4">
            <div className="bg-white rounded-xl shadow-sm p-2">
              <div className="flex gap-2 mb-4 border-b">
                <button
                  type="button"
                  onClick={() => {
                    setMessagesSubTab('messages');
                    setMessagesPage(1);
                  }}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    messagesSubTab === 'messages'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Messages
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMessagesSubTab('answers');
                    setAnswersPage(1);
                  }}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    messagesSubTab === 'answers'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Answers
                </button>
              </div>

              {messagesSubTab === 'messages' ? (
                <>
                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="Search messages..."
                      value={messagesSearch}
                      onChange={(e) => {
                        setMessagesSearch(e.target.value);
                        setMessagesPage(1);
                      }}
                      className="flex-1"
                    />
                  </div>
                  
                  {messagesLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No messages found</div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {messages.map((message) => (
                        <div key={message.id} className={`p-2 border rounded-lg ${message.hidden ? 'bg-gray-50 opacity-60' : ''}`}>
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] text-gray-500 mb-0.5">
                                {message.author ? `${message.author.firstName} ${message.author.lastName}` : 'Unknown'} • {new Date(message.createdAt).toLocaleString()}
                                {message.conversation && ` • ${message.conversation.title || message.conversation.id}`}
                                {message.hidden && <span className="ml-1 text-red-600">(Hidden)</span>}
                              </div>
                              <div className="text-xs text-gray-900 break-words">
                                {message.content || '(No content)'}
                              </div>
                              {message.attachmentName && (
                                <div className="text-[9px] text-gray-400 mt-0.5">Attachment: {message.attachmentName}</div>
                              )}
                            </div>
                            <div className="flex gap-0.5 flex-shrink-0">
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => {
                                  setEditMessageDialog({ open: true, message });
                                  setEditMessageContent(message.content || '');
                                }}
                                aria-label="Edit"
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => handleToggleMessageVisibility(message.id, message.hidden)}
                                aria-label={message.hidden ? "Show" : "Hide"}
                              >
                                {message.hidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              </Button>
                              <Button
                                size="icon"
                                variant="destructive"
                                onClick={() => handleDeleteMessage(message.id)}
                                aria-label="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="Search answers..."
                      value={answersSearch}
                      onChange={(e) => {
                        setAnswersSearch(e.target.value);
                        setAnswersPage(1);
                      }}
                      className="flex-1"
                    />
                  </div>
                  
                  {answersLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading answers...</div>
                  ) : answers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No answers found</div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {answers.map((answer) => (
                        <div key={answer.id} className={`p-2 border rounded-lg ${answer.hidden ? 'bg-gray-50 opacity-60' : ''}`}>
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] text-gray-500 mb-0.5">
                                {answer.author ? `${answer.author.firstName} ${answer.author.lastName}` : 'Unknown'} • {new Date(answer.createdAt).toLocaleString()}
                                {answer.case && ` • ${answer.case.title || answer.case.id}`}
                                {answer.hidden && <span className="ml-1 text-red-600">(Hidden)</span>}
                                <span className="ml-1">• Votes: {answer.votes || 0}</span>
                              </div>
                              <div className="text-xs text-gray-900 break-words">
                                {answer.content || '(No content)'}
                              </div>
                              {answer.attachmentName && (
                                <div className="text-[9px] text-gray-400 mt-0.5">Attachment: {answer.attachmentName}</div>
                              )}
                            </div>
                            <div className="flex gap-0.5 flex-shrink-0">
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => {
                                  setEditAnswerDialog({ open: true, answer });
                                  setEditAnswerContent(answer.content || '');
                                }}
                                aria-label="Edit"
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => handleToggleAnswerVisibility(answer.id, answer.hidden)}
                                aria-label={answer.hidden ? "Show" : "Hide"}
                              >
                                {answer.hidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              </Button>
                              <Button
                                size="icon"
                                variant="destructive"
                                onClick={() => handleDeleteAnswer(answer.id)}
                                aria-label="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="hospitals" className="mt-4">
            <div className="bg-white rounded-xl shadow-sm p-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-2 flex-1">
                  <Input
                    placeholder="Search hospitals..."
                    value={hospitalsSearch}
                    onChange={(e) => setHospitalsSearch(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <Button
                  onClick={() => {
                    resetHospitalForm();
                    setNewHospitalDialog(true);
                  }}
                  className="ml-2"
                  size="sm"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Add Hospital
                </Button>
              </div>
              
              {hospitalsLoading ? (
                <div className="text-center py-8 text-gray-500">Loading hospitals...</div>
              ) : hospitals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No hospitals found</div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {hospitals.map((hospital) => (
                    <div key={hospital.id} className="p-2 border rounded-lg">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <h4 className="text-xs font-semibold text-gray-800">{hospital.name}</h4>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                              hospital.level === 'tertiary' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                              hospital.level === 'secondary' ? 'bg-green-100 text-green-800 border-green-300' :
                              'bg-gray-100 text-gray-800 border-gray-300'
                            }`}>
                              {hospital.level.charAt(0).toUpperCase() + hospital.level.slice(1)}
                            </span>
                          </div>
                          <div className="space-y-0.5 text-[10px] text-gray-600">
                            {hospital.city && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {hospital.address && `${hospital.address}, `}
                                {hospital.city}
                                {hospital.region && `, ${hospital.region}`}
                                {hospital.country && `, ${hospital.country}`}
                              </div>
                            )}
                            {hospital.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {hospital.phone}
                              </div>
                            )}
                            {hospital.email && (
                              <div className="flex items-center gap-1">
                                <MailIcon className="w-3 h-3" />
                                {hospital.email}
                              </div>
                            )}
                            {hospital.bedCapacity > 0 && (
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {hospital.bedCapacity.toLocaleString()} beds
                              </div>
                            )}
                            {hospital.clinicSchedules && hospital.clinicSchedules.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {hospital.clinicSchedules.length} clinic schedule{hospital.clinicSchedules.length !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => openEditHospital(hospital)}
                            aria-label="Edit"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => handleDeleteHospital(hospital.id)}
                            aria-label="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="broadcast" className="mt-4">
            <div className="bg-white rounded-xl shadow-sm p-2">
              <Button onClick={() => setBroadcastDialog(true)} className="w-full mb-4">
                <Mail className="w-4 h-4 mr-2" />
                Broadcast Message to All Users
              </Button>
              <p className="text-sm text-gray-600">
                Send a message to all users on the platform. This will create a group conversation with all users.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialog.open} onOpenChange={(open) => {
        if (!open && !loading) {
          setResetPasswordDialog({ open: false, user: null });
          setNewPassword('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Reset password for {resetPasswordDialog.user?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="New password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newPassword && !loading) {
                  handleResetPassword();
                }
              }}
            />
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setResetPasswordDialog({ open: false, user: null });
                  setNewPassword('');
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={handleResetPassword} disabled={loading || !newPassword}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteUserDialog.open} onOpenChange={(open) => {
        if (!open && !loading) {
          setDeleteUserDialog({ open: false, user: null });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteUserDialog.user?.email}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setDeleteUserDialog({ open: false, user: null })}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDeleteUser();
              }} 
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete User'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Message Dialog */}
      <Dialog open={editMessageDialog.open} onOpenChange={(open) => {
        if (!open && !loading) {
          setEditMessageDialog({ open: false, message: null });
          setEditMessageContent('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Message</DialogTitle>
            <DialogDescription>
              Edit message content
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Message content..."
              value={editMessageContent}
              onChange={(e) => setEditMessageContent(e.target.value)}
              rows={5}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => {
                setEditMessageDialog({ open: false, message: null });
                setEditMessageContent('');
              }} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleEditMessage} disabled={loading || !editMessageContent.trim()}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Answer Dialog */}
      <Dialog open={editAnswerDialog.open} onOpenChange={(open) => {
        if (!open && !loading) {
          setEditAnswerDialog({ open: false, answer: null });
          setEditAnswerContent('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Answer</DialogTitle>
            <DialogDescription>
              Edit answer content
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Answer content..."
              value={editAnswerContent}
              onChange={(e) => setEditAnswerContent(e.target.value)}
              rows={5}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => {
                setEditAnswerDialog({ open: false, answer: null });
                setEditAnswerContent('');
              }} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleEditAnswer} disabled={loading || !editAnswerContent.trim()}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Hospital Dialog */}
      <Dialog open={newHospitalDialog} onOpenChange={(open) => {
        if (!open && !loading) {
          setNewHospitalDialog(false);
          resetHospitalForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Hospital</DialogTitle>
            <DialogDescription>
              Create a new hospital entry in the directory
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Hospital Name *</label>
                <Input
                  value={hospitalFormData.name || ''}
                  onChange={(e) => setHospitalFormData({ ...hospitalFormData, name: e.target.value })}
                  placeholder="Hospital name"
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Level</label>
                <select
                  value={hospitalFormData.level || 'primary'}
                  onChange={(e) => setHospitalFormData({ ...hospitalFormData, level: e.target.value as any })}
                  className="w-full h-9 text-xs border border-gray-300 rounded-md px-2"
                >
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="tertiary">Tertiary</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Address</label>
              <Input
                value={hospitalFormData.address || ''}
                onChange={(e) => setHospitalFormData({ ...hospitalFormData, address: e.target.value })}
                placeholder="Street address"
                className="text-xs"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">City</label>
                <Input
                  value={hospitalFormData.city || ''}
                  onChange={(e) => setHospitalFormData({ ...hospitalFormData, city: e.target.value })}
                  placeholder="City"
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Region</label>
                <Input
                  value={hospitalFormData.region || ''}
                  onChange={(e) => setHospitalFormData({ ...hospitalFormData, region: e.target.value })}
                  placeholder="Region"
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Country</label>
                <Input
                  value={hospitalFormData.country || ''}
                  onChange={(e) => setHospitalFormData({ ...hospitalFormData, country: e.target.value })}
                  placeholder="Country"
                  className="text-xs"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Latitude</label>
                <Input
                  type="number"
                  step="any"
                  value={hospitalFormData.latitude || ''}
                  onChange={(e) => setHospitalFormData({ ...hospitalFormData, latitude: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="e.g., 5.6037"
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Longitude</label>
                <Input
                  type="number"
                  step="any"
                  value={hospitalFormData.longitude || ''}
                  onChange={(e) => setHospitalFormData({ ...hospitalFormData, longitude: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="e.g., -0.1870"
                  className="text-xs"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Phone</label>
                <Input
                  value={hospitalFormData.phone || ''}
                  onChange={(e) => setHospitalFormData({ ...hospitalFormData, phone: e.target.value })}
                  placeholder="+233 302 665 401"
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Email</label>
                <Input
                  type="email"
                  value={hospitalFormData.email || ''}
                  onChange={(e) => setHospitalFormData({ ...hospitalFormData, email: e.target.value })}
                  placeholder="info@hospital.com"
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Website</label>
                <Input
                  value={hospitalFormData.website || ''}
                  onChange={(e) => setHospitalFormData({ ...hospitalFormData, website: e.target.value })}
                  placeholder="www.hospital.com"
                  className="text-xs"
                />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Bed Capacity</label>
              <Input
                type="number"
                value={hospitalFormData.bedCapacity || 0}
                onChange={(e) => setHospitalFormData({ ...hospitalFormData, bedCapacity: parseInt(e.target.value) || 0 })}
                placeholder="0"
                className="text-xs"
              />
            </div>
            
            <div className="border-t pt-3">
              <label className="text-xs font-medium text-gray-700 mb-2 block">Services</label>
              <div className="space-y-2">
                {(['clinics', 'inPatient', 'labsAndImaging', 'special'] as const).map((serviceType) => {
                  const serviceTypeKey = serviceType as keyof typeof hospitalFormData.services;
                  return (
                    <div key={serviceType}>
                      <label className="text-[10px] font-medium text-gray-600 mb-1 block capitalize">
                        {serviceType === 'inPatient' ? 'In-Patient Services' : serviceType === 'labsAndImaging' ? 'Labs & Imaging' : serviceType}
                      </label>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {(hospitalFormData.services?.[serviceTypeKey] || []).map((service, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded border border-blue-200">
                            {service}
                            <button
                              type="button"
                              onClick={() => removeService(serviceTypeKey, idx)}
                              className="hover:text-blue-900"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-1">
                        <Input
                          value={newService.type === serviceTypeKey ? newService.value : ''}
                          onChange={(e) => setNewService({ type: serviceTypeKey, value: e.target.value })}
                          placeholder="Add service"
                          className="flex-1 h-7 text-xs"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && newService.type === serviceTypeKey && newService.value.trim()) {
                              e.preventDefault();
                              addService();
                            }
                          }}
                          onFocus={() => setNewService({ type: serviceTypeKey, value: '' })}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={addService}
                          disabled={newService.type !== serviceTypeKey || !newService.value.trim()}
                          className="h-7 text-xs px-2"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="border-t pt-3">
              <label className="text-xs font-medium text-gray-700 mb-2 block">Clinic Schedules</label>
              <div className="space-y-2 mb-2">
                {(hospitalFormData.clinicSchedules || []).map((schedule, idx) => (
                  <div key={idx} className="p-2 border rounded-lg bg-gray-50">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1">
                        <div className="text-xs font-semibold">{schedule.clinicName}</div>
                        <div className="text-[10px] text-gray-600">
                          {schedule.days.join(', ')} • {schedule.time}
                          {schedule.doctor && ` • Dr. ${schedule.doctor}`}
                        </div>
                        {schedule.notes && (
                          <div className="text-[10px] text-gray-500 mt-0.5">{schedule.notes}</div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSchedule(idx)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Input
                  value={newSchedule.clinicName}
                  onChange={(e) => setNewSchedule({ ...newSchedule, clinicName: e.target.value })}
                  placeholder="Clinic name"
                  className="h-7 text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={newSchedule.days}
                    onChange={(e) => setNewSchedule({ ...newSchedule, days: e.target.value })}
                    placeholder="Days (e.g., Monday, Wednesday, Friday)"
                    className="h-7 text-xs"
                  />
                  <Input
                    value={newSchedule.time}
                    onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                    placeholder="Time (e.g., 09:00-17:00)"
                    className="h-7 text-xs"
                  />
                </div>
                <Input
                  value={newSchedule.doctor}
                  onChange={(e) => setNewSchedule({ ...newSchedule, doctor: e.target.value })}
                  placeholder="Doctor name (optional)"
                  className="h-7 text-xs"
                />
                <Textarea
                  value={newSchedule.notes}
                  onChange={(e) => setNewSchedule({ ...newSchedule, notes: e.target.value })}
                  placeholder="Notes (optional)"
                  rows={2}
                  className="text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={addSchedule}
                  disabled={!newSchedule.clinicName.trim() || !newSchedule.days.trim() || !newSchedule.time.trim()}
                  className="w-full h-7 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Schedule
                </Button>
              </div>
            </div>
            
            <div className="flex gap-2 justify-end pt-2 border-t">
              <Button variant="outline" onClick={() => {
                setNewHospitalDialog(false);
                resetHospitalForm();
              }} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleCreateHospital} disabled={loading || !hospitalFormData.name?.trim()}>
                {loading ? 'Creating...' : 'Create Hospital'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Hospital Dialog */}
      <Dialog open={editHospitalDialog.open} onOpenChange={(open) => {
        if (!open && !loading) {
          setEditHospitalDialog({ open: false, hospital: null });
          resetHospitalForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Hospital</DialogTitle>
            <DialogDescription>
              Update hospital information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Hospital Name *</label>
                <Input
                  value={hospitalFormData.name || ''}
                  onChange={(e) => setHospitalFormData({ ...hospitalFormData, name: e.target.value })}
                  placeholder="Hospital name"
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Level</label>
                <select
                  value={hospitalFormData.level || 'primary'}
                  onChange={(e) => setHospitalFormData({ ...hospitalFormData, level: e.target.value as any })}
                  className="w-full h-9 text-xs border border-gray-300 rounded-md px-2"
                >
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="tertiary">Tertiary</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Address</label>
              <Input
                value={hospitalFormData.address || ''}
                onChange={(e) => setHospitalFormData({ ...hospitalFormData, address: e.target.value })}
                placeholder="Street address"
                className="text-xs"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">City</label>
                <Input
                  value={hospitalFormData.city || ''}
                  onChange={(e) => setHospitalFormData({ ...hospitalFormData, city: e.target.value })}
                  placeholder="City"
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Region</label>
                <Input
                  value={hospitalFormData.region || ''}
                  onChange={(e) => setHospitalFormData({ ...hospitalFormData, region: e.target.value })}
                  placeholder="Region"
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Country</label>
                <Input
                  value={hospitalFormData.country || ''}
                  onChange={(e) => setHospitalFormData({ ...hospitalFormData, country: e.target.value })}
                  placeholder="Country"
                  className="text-xs"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Latitude</label>
                <Input
                  type="number"
                  step="any"
                  value={hospitalFormData.latitude || ''}
                  onChange={(e) => setHospitalFormData({ ...hospitalFormData, latitude: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="e.g., 5.6037"
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Longitude</label>
                <Input
                  type="number"
                  step="any"
                  value={hospitalFormData.longitude || ''}
                  onChange={(e) => setHospitalFormData({ ...hospitalFormData, longitude: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="e.g., -0.1870"
                  className="text-xs"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Phone</label>
                <Input
                  value={hospitalFormData.phone || ''}
                  onChange={(e) => setHospitalFormData({ ...hospitalFormData, phone: e.target.value })}
                  placeholder="+233 302 665 401"
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Email</label>
                <Input
                  type="email"
                  value={hospitalFormData.email || ''}
                  onChange={(e) => setHospitalFormData({ ...hospitalFormData, email: e.target.value })}
                  placeholder="info@hospital.com"
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Website</label>
                <Input
                  value={hospitalFormData.website || ''}
                  onChange={(e) => setHospitalFormData({ ...hospitalFormData, website: e.target.value })}
                  placeholder="www.hospital.com"
                  className="text-xs"
                />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Bed Capacity</label>
              <Input
                type="number"
                value={hospitalFormData.bedCapacity || 0}
                onChange={(e) => setHospitalFormData({ ...hospitalFormData, bedCapacity: parseInt(e.target.value) || 0 })}
                placeholder="0"
                className="text-xs"
              />
            </div>
            
            <div className="border-t pt-3">
              <label className="text-xs font-medium text-gray-700 mb-2 block">Services</label>
              <div className="space-y-2">
                {(['clinics', 'inPatient', 'labsAndImaging', 'special'] as const).map((serviceType) => {
                  const serviceTypeKey = serviceType as keyof typeof hospitalFormData.services;
                  return (
                    <div key={serviceType}>
                      <label className="text-[10px] font-medium text-gray-600 mb-1 block capitalize">
                        {serviceType === 'inPatient' ? 'In-Patient Services' : serviceType === 'labsAndImaging' ? 'Labs & Imaging' : serviceType}
                      </label>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {(hospitalFormData.services?.[serviceTypeKey] || []).map((service, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded border border-blue-200">
                            {service}
                            <button
                              type="button"
                              onClick={() => removeService(serviceTypeKey, idx)}
                              className="hover:text-blue-900"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-1">
                        <Input
                          value={newService.type === serviceTypeKey ? newService.value : ''}
                          onChange={(e) => setNewService({ type: serviceTypeKey, value: e.target.value })}
                          placeholder="Add service"
                          className="flex-1 h-7 text-xs"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && newService.type === serviceTypeKey && newService.value.trim()) {
                              e.preventDefault();
                              addService();
                            }
                          }}
                          onFocus={() => setNewService({ type: serviceTypeKey, value: '' })}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={addService}
                          disabled={newService.type !== serviceTypeKey || !newService.value.trim()}
                          className="h-7 text-xs px-2"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="border-t pt-3">
              <label className="text-xs font-medium text-gray-700 mb-2 block">Clinic Schedules</label>
              <div className="space-y-2 mb-2">
                {(hospitalFormData.clinicSchedules || []).map((schedule, idx) => (
                  <div key={idx} className="p-2 border rounded-lg bg-gray-50">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1">
                        <div className="text-xs font-semibold">{schedule.clinicName}</div>
                        <div className="text-[10px] text-gray-600">
                          {schedule.days.join(', ')} • {schedule.time}
                          {schedule.doctor && ` • Dr. ${schedule.doctor}`}
                        </div>
                        {schedule.notes && (
                          <div className="text-[10px] text-gray-500 mt-0.5">{schedule.notes}</div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSchedule(idx)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Input
                  value={newSchedule.clinicName}
                  onChange={(e) => setNewSchedule({ ...newSchedule, clinicName: e.target.value })}
                  placeholder="Clinic name"
                  className="h-7 text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={newSchedule.days}
                    onChange={(e) => setNewSchedule({ ...newSchedule, days: e.target.value })}
                    placeholder="Days (e.g., Monday, Wednesday, Friday)"
                    className="h-7 text-xs"
                  />
                  <Input
                    value={newSchedule.time}
                    onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                    placeholder="Time (e.g., 09:00-17:00)"
                    className="h-7 text-xs"
                  />
                </div>
                <Input
                  value={newSchedule.doctor}
                  onChange={(e) => setNewSchedule({ ...newSchedule, doctor: e.target.value })}
                  placeholder="Doctor name (optional)"
                  className="h-7 text-xs"
                />
                <Textarea
                  value={newSchedule.notes}
                  onChange={(e) => setNewSchedule({ ...newSchedule, notes: e.target.value })}
                  placeholder="Notes (optional)"
                  rows={2}
                  className="text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={addSchedule}
                  disabled={!newSchedule.clinicName.trim() || !newSchedule.days.trim() || !newSchedule.time.trim()}
                  className="w-full h-7 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Schedule
                </Button>
              </div>
            </div>
            
            <div className="flex gap-2 justify-end pt-2 border-t">
              <Button variant="outline" onClick={() => {
                setEditHospitalDialog({ open: false, hospital: null });
                resetHospitalForm();
              }} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleUpdateHospital} disabled={loading || !hospitalFormData.name?.trim()}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editUserDialog.open} onOpenChange={(open) => {
        if (!open && !loading) {
          setEditUserDialog({ open: false, user: null });
          setEditUserData({});
          setEditUserCredentialInput('');
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user profile information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">First Name</label>
                <Input
                  value={editUserData.firstName || ''}
                  onChange={(e) => setEditUserData({ ...editUserData, firstName: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Last Name</label>
                <Input
                  value={editUserData.lastName || ''}
                  onChange={(e) => setEditUserData({ ...editUserData, lastName: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Title</label>
                <Input
                  value={editUserData.title || ''}
                  onChange={(e) => setEditUserData({ ...editUserData, title: e.target.value })}
                  placeholder="Dr."
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Email</label>
                <Input
                  type="email"
                  value={editUserData.email || ''}
                  onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Phone Number</label>
                <Input
                  value={editUserData.phoneNumber || ''}
                  onChange={(e) => setEditUserData({ ...editUserData, phoneNumber: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Country</label>
                <Input
                  value={editUserData.country || ''}
                  onChange={(e) => setEditUserData({ ...editUserData, country: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Hospital</label>
                <Input
                  value={editUserData.hospital || ''}
                  onChange={(e) => setEditUserData({ ...editUserData, hospital: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Specialty</label>
                <Input
                  value={editUserData.specialty || ''}
                  onChange={(e) => setEditUserData({ ...editUserData, specialty: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">License Number</label>
              <Input
                value={editUserData.licenseNumber || ''}
                onChange={(e) => setEditUserData({ ...editUserData, licenseNumber: e.target.value })}
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Bio</label>
              <Textarea
                value={editUserData.bio || ''}
                onChange={(e) => setEditUserData({ ...editUserData, bio: e.target.value })}
                rows={3}
                className="text-xs"
              />
            </div>

            <div className="border-t pt-3">
              <label className="text-xs font-medium text-gray-700 mb-2 block">Credentials</label>
              <div className="flex flex-wrap gap-1 mb-2">
                {(editUserData.credentials || []).map((cred, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded border border-blue-200">
                    {cred}
                    <button
                      type="button"
                      onClick={() => removeEditUserCredential(idx)}
                      className="hover:text-blue-900"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-1">
                <Input
                  value={editUserCredentialInput}
                  onChange={(e) => setEditUserCredentialInput(e.target.value)}
                  placeholder="Add credential"
                  className="flex-1 h-7 text-xs"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addEditUserCredential();
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={addEditUserCredential}
                  disabled={!editUserCredentialInput.trim()}
                  className="h-7 text-xs px-2"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Role</label>
                <select
                  value={editUserData.role || 'doctor'}
                  onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value as any })}
                  disabled={editUserDialog.user?.id === currentUser?.id}
                  className="w-full h-9 text-xs border border-gray-300 rounded-md px-2"
                >
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                  <option value="hospital_admin">Hospital Admin</option>
                </select>
                {editUserDialog.user?.id === currentUser?.id && (
                  <p className="text-[10px] text-gray-500 mt-0.5">Cannot change your own role</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showPhone"
                  checked={editUserData.showPhone !== undefined ? editUserData.showPhone : true}
                  onChange={(e) => setEditUserData({ ...editUserData, showPhone: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="showPhone" className="text-xs text-gray-700">Show Phone Number</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showEmail"
                  checked={editUserData.showEmail !== undefined ? editUserData.showEmail : true}
                  onChange={(e) => setEditUserData({ ...editUserData, showEmail: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="showEmail" className="text-xs text-gray-700">Show Email</label>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t">
              <Button variant="outline" onClick={() => {
                setEditUserDialog({ open: false, user: null });
                setEditUserData({});
                setEditUserCredentialInput('');
              }} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleUpdateUser} disabled={loading || !editUserData.firstName || !editUserData.lastName || !editUserData.email}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Broadcast Dialog */}
      <Dialog open={broadcastDialog} onOpenChange={setBroadcastDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Broadcast Message</DialogTitle>
            <DialogDescription>
              Send a message to all users on the platform
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Title (optional)"
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
            />
            <Textarea
              placeholder="Message content..."
              value={broadcastContent}
              onChange={(e) => setBroadcastContent(e.target.value)}
              rows={5}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setBroadcastDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleBroadcast} disabled={loading || !broadcastContent.trim()}>
                Send Broadcast
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

