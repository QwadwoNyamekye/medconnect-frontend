'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppLayout } from '@/components/layout/AppLayout';
import { usersAPI, hospitalsAPI, conversationsAPI, authAPI } from '@/lib/api';
import { Search, Filter, X, Mail, Phone, Award, Building2, GraduationCap, Star, MessageSquare, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Doctor {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phoneNumber: string | null;
  specialty: string;
  hospital: string;
  credentials: string[];
  score: number;
  showPhone?: boolean;
  showEmail?: boolean;
}

export default function DoctorsPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hospitalFilters, setHospitalFilters] = useState<string[]>([]);
  const [specialtyFilters, setSpecialtyFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [availableHospitals, setAvailableHospitals] = useState<string[]>([]);
  const [availableSpecialties, setAvailableSpecialties] = useState<string[]>([]);
  const [creatingConversation, setCreatingConversation] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window === 'undefined') return;
      const token = localStorage.getItem('token');
      const raw = localStorage.getItem('user');
      
      if (token) {
        // If we have a token but no user data, fetch it
        if (!raw) {
          try {
            const user = await authAPI.getMe();
            if (user?.id) {
              localStorage.setItem('user', JSON.stringify(user));
              setCurrentUser(user);
              setIsAuthed(true);
            } else {
              setCurrentUser(null);
              setIsAuthed(false);
            }
          } catch (error) {
            console.error('Failed to fetch user data:', error);
            // Token might be invalid, clear it
            localStorage.removeItem('token');
            setCurrentUser(null);
            setIsAuthed(false);
          }
        } else {
          // We have both token and user data
          try {
            const user = JSON.parse(raw);
            setCurrentUser(user);
            setIsAuthed(Boolean(user?.id));
          } catch {
            setCurrentUser(null);
            setIsAuthed(false);
          }
        }
      } else {
        // No token, clear everything
        setCurrentUser(null);
        setIsAuthed(false);
      }
    };

    checkAuth();
    // Also check when storage changes (e.g., after login)
    if (typeof window !== 'undefined') {
      const handleStorageChange = () => checkAuth();
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('medconnect-auth-changed', handleStorageChange);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('medconnect-auth-changed', handleStorageChange);
      };
    }
  }, []);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await usersAPI.list({
          search: searchQuery.trim() || undefined,
          hospitals: hospitalFilters.length > 0 ? hospitalFilters : undefined,
          specialties: specialtyFilters.length > 0 ? specialtyFilters : undefined,
        });
        setDoctors(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load doctors');
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [searchQuery, hospitalFilters, specialtyFilters]);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const hospitals = await hospitalsAPI.getAll();
        if (Array.isArray(hospitals)) {
          const hospitalNames = hospitals.map((h: any) => h.name || h).filter(Boolean);
          setAvailableHospitals([...new Set(hospitalNames)].sort());
        }
      } catch (err) {
        console.error('Failed to load hospitals:', err);
      }
    };

    fetchHospitals();
  }, []);

  useEffect(() => {
    // Extract unique specialties from doctors
    const specialties = [...new Set(doctors.map(d => d.specialty).filter(Boolean))].sort();
    setAvailableSpecialties(specialties);
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    let filtered = [...doctors];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doctor => {
        const fullName = `${doctor.lastName}, ${doctor.firstName}`.toLowerCase();
        const name = `${doctor.firstName} ${doctor.lastName}`.toLowerCase();
        const credentialsStr = (doctor.credentials || []).join(' ').toLowerCase();
        return (
          fullName.includes(query) ||
          name.includes(query) ||
          doctor.email?.toLowerCase().includes(query) ||
          doctor.phoneNumber?.toLowerCase().includes(query) ||
          doctor.specialty?.toLowerCase().includes(query) ||
          doctor.hospital?.toLowerCase().includes(query) ||
          doctor.title?.toLowerCase().includes(query) ||
          credentialsStr.includes(query)
        );
      });
    }

    // Apply hospital filters (multiple)
    if (hospitalFilters.length > 0) {
      filtered = filtered.filter(doctor =>
        hospitalFilters.some(filter =>
          doctor.hospital?.toLowerCase().includes(filter.toLowerCase())
        )
      );
    }

    // Apply specialty filters (multiple)
    if (specialtyFilters.length > 0) {
      filtered = filtered.filter(doctor =>
        specialtyFilters.some(filter =>
          doctor.specialty?.toLowerCase().includes(filter.toLowerCase())
        )
      );
    }

    // Sort alphabetically by last name
    return filtered.sort((a, b) => {
      const lastNameA = (a.lastName || '').toLowerCase();
      const lastNameB = (b.lastName || '').toLowerCase();
      if (lastNameA !== lastNameB) {
        return lastNameA.localeCompare(lastNameB);
      }
      // If last names are equal, sort by first name
      const firstNameA = (a.firstName || '').toLowerCase();
      const firstNameB = (b.firstName || '').toLowerCase();
      return firstNameA.localeCompare(firstNameB);
    });
  }, [doctors, searchQuery, hospitalFilters, specialtyFilters]);

  const handleHomeNav = () => {
    router.push('/');
  };

  const handlePostNav = () => {
    router.push('/?view=post');
  };

  const handleAccountNav = () => {
    if (typeof window !== 'undefined') {
      if (isAuthed) {
        localStorage.setItem('medconnect-open-profile', '1');
        window.dispatchEvent(new Event('medconnect-open-profile'));
      } else {
        localStorage.setItem('medconnect-show-auth', '1');
        window.dispatchEvent(new Event('medconnect-show-auth'));
      }
    }
    router.push('/');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setHospitalFilters([]);
    setSpecialtyFilters([]);
  };

  const hasActiveFilters = searchQuery.trim() || hospitalFilters.length > 0 || specialtyFilters.length > 0;

  const toggleHospitalFilter = (hospital: string) => {
    setHospitalFilters((prev) =>
      prev.includes(hospital)
        ? prev.filter((h) => h !== hospital)
        : [...prev, hospital]
    );
  };

  const toggleSpecialtyFilter = (specialty: string) => {
    setSpecialtyFilters((prev) =>
      prev.includes(specialty)
        ? prev.filter((s) => s !== specialty)
        : [...prev, specialty]
    );
  };

  const handleStartConversation = async (doctorId: string) => {
    // Re-check auth state right before using it
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    let user = currentUser;
    
    // If we have a token but no user, try to fetch it
    if (token && !user) {
      try {
        user = await authAPI.getMe();
        if (user?.id) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(user));
          }
          setCurrentUser(user);
          setIsAuthed(true);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    }
    
    const actuallyAuthed = Boolean(token && user?.id);
    
    if (!actuallyAuthed) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('medconnect-show-auth', '1');
      }
      router.push('/');
      return;
    }

    if (doctorId === user?.id) {
      alert('You cannot message yourself.');
      return;
    }

    setCreatingConversation(doctorId);
    
    try {
      const response = await conversationsAPI.create({
        participantIds: [doctorId],
      });
      
      // Handle different response formats
      const conversationId = response?.id || response?.data?.id || response?.conversation?.id;
      
      if (conversationId) {
        router.push(`/messages/${conversationId}`);
      } else {
        alert('Failed to create conversation: Invalid response from server.');
      }
    } catch (error: any) {
      console.error('Failed to create conversation:', error);
      let errorMessage = error?.message || error?.error || 'Failed to start conversation. Please try again.';
      
      // Include validation details if available
      if (error?.details && Array.isArray(error.details) && error.details.length > 0) {
        const validationMessages = error.details.map((detail: any) => detail.msg || detail.message).join('\n');
        errorMessage = `${errorMessage}\n\n${validationMessages}`;
      } else if (error?.details && typeof error.details === 'string') {
        errorMessage = `${errorMessage}\n\n${error.details}`;
      }
      
      alert(errorMessage);
    } finally {
      setCreatingConversation(null);
    }
  };

  return (
    <AppLayout
      isAuthed={isAuthed}
      unreadConversations={0}
      isAdmin={currentUser?.role === 'admin'}
      onHome={handleHomeNav}
      onPost={handlePostNav}
      onAccount={handleAccountNav}
    >
      {/* Mobile Header */}
      <div className="sm:hidden">
        <AppHeader />
      </div>
      <div className="sm:max-w-5xl mx-auto px-2 sm:px-0 py-2 space-y-2">
          <div className="flex items-center justify-between gap-1.5">
            <h1 className="text-sm font-semibold text-gray-800 flex items-center gap-1">
              <GraduationCap className="text-blue-600" size={18} />
              Doctors Directory
            </h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5"
            >
              <Filter size={16} />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm p-2 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Search by name, email, phone, specialty, hospital, title, or credentials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 text-sm"
              />
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-gray-600">Hospitals</label>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1.5">
                    {availableHospitals.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-2">No hospitals available</p>
                    ) : (
                      availableHospitals.map((hospital) => (
                        <label
                          key={hospital}
                          className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg"
                        >
                          <input
                            type="checkbox"
                            checked={hospitalFilters.includes(hospital)}
                            onChange={() => toggleHospitalFilter(hospital)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-700">{hospital}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-gray-600">Specialties</label>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1.5">
                    {availableSpecialties.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-2">No specialties available</p>
                    ) : (
                      availableSpecialties.map((specialty) => (
                        <label
                          key={specialty}
                          className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg"
                        >
                          <input
                            type="checkbox"
                            checked={specialtyFilters.includes(specialty)}
                            onChange={() => toggleSpecialtyFilter(specialty)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-700">{specialty}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200">
                <span className="text-xs text-gray-500">Active filters:</span>
                {searchQuery.trim() && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs">
                    Search: "{searchQuery}"
                    <button onClick={() => setSearchQuery('')} className="hover:text-blue-900">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {hospitalFilters.map((hospital) => (
                  <span
                    key={hospital}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs"
                  >
                    Hospital: {hospital}
                    <button
                      onClick={() => toggleHospitalFilter(hospital)}
                      className="hover:text-blue-900"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {specialtyFilters.map((specialty) => (
                  <span
                    key={specialty}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs"
                  >
                    Specialty: {specialty}
                    <button
                      onClick={() => toggleSpecialtyFilter(specialty)}
                      className="hover:text-blue-900"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs h-7 px-2"
                >
                  Clear All
                </Button>
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className="text-xs text-gray-500">
            {loading ? (
              'Loading...'
            ) : error ? (
              <span className="text-red-600">{error}</span>
            ) : (
              `Showing ${filteredDoctors.length} of ${doctors.length} doctor${doctors.length !== 1 ? 's' : ''}`
            )}
          </div>

          {/* Doctors Grid */}
          {loading ? (
            <div className="text-center py-12 text-sm text-gray-400">
              Loading doctors...
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">No doctors found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredDoctors.map((doctor) => (
                <Card key={doctor.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-2 space-y-1.5">
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-semibold text-gray-800 truncate">
                          {doctor.title} {doctor.lastName}, {doctor.firstName}
                        </h3>
                        {doctor.credentials && doctor.credentials.length > 0 && (
                          <p className="text-[10px] text-blue-700 font-medium mt-0.5">
                            {doctor.credentials.join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 text-[10px] text-blue-600 font-semibold">
                        <Star size={12} className="fill-blue-600 text-blue-600" />
                        {doctor.score?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '0'}
                      </div>
                    </div>

                    <div className="space-y-1 text-[10px] text-gray-600">
                      {doctor.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail size={10} className="text-gray-400 flex-shrink-0" />
                          <a href={`mailto:${doctor.email}`} className="truncate hover:text-blue-600 hover:underline">
                            {doctor.email}
                          </a>
                        </div>
                      )}
                      {doctor.phoneNumber && (
                        <div className="flex items-center gap-1.5">
                          <Phone size={10} className="text-gray-400 flex-shrink-0" />
                          <a href={`tel:${doctor.phoneNumber}`} className="hover:text-blue-600 hover:underline">
                            {doctor.phoneNumber}
                          </a>
                        </div>
                      )}
                      {doctor.specialty && (
                        <div className="flex items-center gap-1.5">
                          <GraduationCap size={10} className="text-gray-400 flex-shrink-0" />
                          <span>{doctor.specialty}</span>
                        </div>
                      )}
                      {doctor.hospital && (
                        <div className="flex items-center gap-1.5">
                          <Building2 size={10} className="text-gray-400 flex-shrink-0" />
                          <span className="truncate">{doctor.hospital}</span>
                        </div>
                      )}
                    </div>

                    {doctor.id !== currentUser?.id && (
                      <div className="pt-1.5 border-t border-gray-100">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleStartConversation(doctor.id)}
                          disabled={creatingConversation === doctor.id}
                          className="w-full h-7 text-[10px]"
                          aria-label="Message"
                        >
                          {creatingConversation === doctor.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <MessageSquare size={12} />
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
      </div>
    </AppLayout>
  );
}

