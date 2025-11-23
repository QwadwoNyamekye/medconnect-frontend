'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, Phone, Mail, Globe, Building2, Users, Calendar, Clock, Filter, X } from 'lucide-react';
import { hospitalsAPI, type Hospital, type HospitalFilters } from '@/lib/api/hospitals';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppHeader } from '@/components/layout/AppHeader';
import { useRouter } from 'next/navigation';

export default function HospitalsPage() {
  const router = useRouter();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<HospitalFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window === 'undefined') return;
      const token = localStorage.getItem('token');
      const raw = localStorage.getItem('user');
      setIsAuthed(Boolean(token && raw));
      if (raw) {
        try {
          setCurrentUser(JSON.parse(raw));
        } catch {
          setCurrentUser(null);
        }
      }
    };
    checkAuth();
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
    fetchHospitals();
  }, [filters]);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await hospitalsAPI.getAll(filters);
      setHospitals(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load hospitals');
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm.trim() || undefined,
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'tertiary':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'secondary':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'primary':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getLevelLabel = (level: string) => {
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  const handleHomeNav = () => router.push('/');
  const handlePostNav = () => router.push('/?view=post');
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
            <Building2 className="text-blue-600" size={18} />
            Hospitals Directory
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
              placeholder="Search hospitals, cities, or regions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 h-10 text-sm"
            />
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-gray-200">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Level</label>
                <select
                  value={filters.level || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value as any || undefined }))}
                  className="w-full h-9 text-xs border border-gray-300 rounded-md px-2"
                >
                  <option value="">All Levels</option>
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="tertiary">Tertiary</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                <Input
                  placeholder="Filter by city"
                  value={filters.city || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value || undefined }))}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Region</label>
                <Input
                  placeholder="Filter by region"
                  value={filters.region || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value || undefined }))}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
                <Input
                  placeholder="Filter by country"
                  value={filters.country || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value || undefined }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          )}

          {(filters.level || filters.city || filters.region || filters.country || searchTerm.trim()) && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200">
              <span className="text-xs text-gray-500">Active filters:</span>
              {searchTerm.trim() && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs">
                  Search: "{searchTerm}"
                  <button onClick={() => setSearchTerm('')} className="hover:text-blue-900">
                    <X size={12} />
                  </button>
                </span>
              )}
              {filters.level && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs">
                  Level: {filters.level}
                  <button onClick={() => setFilters(prev => ({ ...prev, level: undefined }))} className="hover:text-blue-900">
                    <X size={12} />
                  </button>
                </span>
              )}
              {filters.city && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs">
                  City: {filters.city}
                  <button onClick={() => setFilters(prev => ({ ...prev, city: undefined }))} className="hover:text-blue-900">
                    <X size={12} />
                  </button>
                </span>
              )}
              {filters.region && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs">
                  Region: {filters.region}
                  <button onClick={() => setFilters(prev => ({ ...prev, region: undefined }))} className="hover:text-blue-900">
                    <X size={12} />
                  </button>
                </span>
              )}
              {filters.country && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs">
                  Country: {filters.country}
                  <button onClick={() => setFilters(prev => ({ ...prev, country: undefined }))} className="hover:text-blue-900">
                    <X size={12} />
                  </button>
                </span>
              )}
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
            `Showing ${hospitals.length} hospital${hospitals.length !== 1 ? 's' : ''}`
          )}
        </div>

        {/* Hospitals Grid */}
        {loading ? (
          <div className="text-center py-12 text-sm text-gray-400">
            Loading hospitals...
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : hospitals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No hospitals found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {hospitals.map((hospital) => (
              <Card
                key={hospital.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedHospital(hospital)}
              >
                <CardContent className="p-2 space-y-1.5">
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-semibold text-gray-800 truncate">{hospital.name}</h3>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getLevelBadgeColor(hospital.level)}`}>
                          {getLevelLabel(hospital.level)}
                        </span>
                        {hospital.city && (
                          <div className="flex items-center text-[10px] text-gray-600">
                            <MapPin className="w-[10px] h-[10px] mr-0.5" />
                            {hospital.city}
                            {hospital.region && `, ${hospital.region}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1 text-[10px] text-gray-600">
                    {hospital.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-[10px] h-[10px] text-gray-400 flex-shrink-0" />
                        <a href={`tel:${hospital.phone}`} className="truncate hover:text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                          {hospital.phone}
                        </a>
                      </div>
                    )}
                    {hospital.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-[10px] h-[10px] text-gray-400 flex-shrink-0" />
                        <a href={`mailto:${hospital.email}`} className="truncate hover:text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                          {hospital.email}
                        </a>
                      </div>
                    )}
                    {hospital.website && (
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-[10px] h-[10px] text-gray-400 flex-shrink-0" />
                        <a
                          href={hospital.website.startsWith('http') ? hospital.website : `https://${hospital.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate hover:text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {hospital.website}
                        </a>
                      </div>
                    )}
                    {hospital.bedCapacity > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Users className="w-[10px] h-[10px] text-gray-400 flex-shrink-0" />
                        <span>{hospital.bedCapacity.toLocaleString()} beds</span>
                      </div>
                    )}
                    {hospital.clinicSchedules && hospital.clinicSchedules.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-[10px] h-[10px] text-gray-400 flex-shrink-0" />
                        <span>{hospital.clinicSchedules.length} clinic schedule{hospital.clinicSchedules.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>

                  {/* Services Preview */}
                  {hospital.services && [
                    ...(hospital.services.clinics || []),
                    ...(hospital.services.inPatient || []),
                    ...(hospital.services.labsAndImaging || []),
                    ...(hospital.services.special || []),
                  ].length > 0 && (
                    <div className="pt-1 border-t border-gray-100">
                      <div className="flex flex-wrap gap-1">
                        {[
                          ...(hospital.services.clinics || []).slice(0, 2),
                          ...(hospital.services.inPatient || []).slice(0, 1),
                          ...(hospital.services.labsAndImaging || []).slice(0, 1),
                        ].map((service, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded">
                            {service}
                          </span>
                        ))}
                        {[
                          ...(hospital.services.clinics || []),
                          ...(hospital.services.inPatient || []),
                          ...(hospital.services.labsAndImaging || []),
                          ...(hospital.services.special || []),
                        ].length > 4 && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded">
                            +{[
                              ...(hospital.services.clinics || []),
                              ...(hospital.services.inPatient || []),
                              ...(hospital.services.labsAndImaging || []),
                              ...(hospital.services.special || []),
                            ].length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-1.5 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-7 text-[10px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedHospital(hospital);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Hospital Detail Modal */}
        {selectedHospital && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4"
            onClick={() => setSelectedHospital(null)}
          >
            <Card
              className="bg-white max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-3">
                <div className="flex items-start justify-between mb-2.5">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold text-gray-900 mb-1">{selectedHospital.name}</h2>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getLevelBadgeColor(selectedHospital.level)}`}>
                        {getLevelLabel(selectedHospital.level)} Care
                      </span>
                      {selectedHospital.city && (
                        <div className="flex items-center text-[10px] text-gray-600">
                          <MapPin className="w-[10px] h-[10px] mr-0.5" />
                          <span className="truncate">
                            {selectedHospital.address && `${selectedHospital.address}, `}
                            {selectedHospital.city}
                            {selectedHospital.region && `, ${selectedHospital.region}`}
                            {selectedHospital.country && `, ${selectedHospital.country}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedHospital(null)} className="h-7 w-7 flex-shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Contact Information */}
                <div className="mb-3 border-b border-gray-100 pb-3">
                  <h3 className="text-xs font-semibold text-gray-900 mb-1.5">Contact Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {selectedHospital.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-[10px] h-[10px] text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-gray-500">Phone</p>
                          <a href={`tel:${selectedHospital.phone}`} className="text-[10px] text-blue-600 hover:underline truncate block">
                            {selectedHospital.phone}
                          </a>
                        </div>
                      </div>
                    )}
                    {selectedHospital.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-[10px] h-[10px] text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-gray-500">Email</p>
                          <a href={`mailto:${selectedHospital.email}`} className="text-[10px] text-blue-600 hover:underline truncate block">
                            {selectedHospital.email}
                          </a>
                        </div>
                      </div>
                    )}
                    {selectedHospital.website && (
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-[10px] h-[10px] text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-gray-500">Website</p>
                          <a
                            href={selectedHospital.website.startsWith('http') ? selectedHospital.website : `https://${selectedHospital.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-blue-600 hover:underline truncate block"
                          >
                            {selectedHospital.website}
                          </a>
                        </div>
                      </div>
                    )}
                    {selectedHospital.bedCapacity > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Users className="w-[10px] h-[10px] text-gray-400 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-500">Bed Capacity</p>
                          <p className="text-[10px] text-gray-900 font-semibold">{selectedHospital.bedCapacity.toLocaleString()} beds</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Services */}
                {selectedHospital.services && (
                  <div className="mb-3 border-b border-gray-100 pb-3">
                    <h3 className="text-xs font-semibold text-gray-900 mb-1.5">Services</h3>
                    <div className="space-y-2">
                      {selectedHospital.services.clinics && selectedHospital.services.clinics.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-semibold text-gray-700 mb-1">Clinics</h4>
                          <div className="flex flex-wrap gap-1">
                            {selectedHospital.services.clinics.map((service, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded border border-blue-200">
                                {service}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedHospital.services.inPatient && selectedHospital.services.inPatient.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-semibold text-gray-700 mb-1">In-Patient Services</h4>
                          <div className="flex flex-wrap gap-1">
                            {selectedHospital.services.inPatient.map((service, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 bg-green-50 text-green-700 text-[10px] rounded border border-green-200">
                                {service}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedHospital.services.labsAndImaging && selectedHospital.services.labsAndImaging.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-semibold text-gray-700 mb-1">Labs & Imaging</h4>
                          <div className="flex flex-wrap gap-1">
                            {selectedHospital.services.labsAndImaging.map((service, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 bg-purple-50 text-purple-700 text-[10px] rounded border border-purple-200">
                                {service}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedHospital.services.special && selectedHospital.services.special.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-semibold text-gray-700 mb-1">Special Services</h4>
                          <div className="flex flex-wrap gap-1">
                            {selectedHospital.services.special.map((service, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 bg-orange-50 text-orange-700 text-[10px] rounded border border-orange-200">
                                {service}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Clinic Schedules */}
                {selectedHospital.clinicSchedules && selectedHospital.clinicSchedules.length > 0 && (
                  <div className="mb-3 border-b border-gray-100 pb-3">
                    <h3 className="text-xs font-semibold text-gray-900 mb-1.5">Clinic Schedules</h3>
                    <div className="space-y-1.5">
                      {selectedHospital.clinicSchedules.map((schedule, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-2">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="text-[10px] font-semibold text-gray-900">{schedule.clinicName}</h4>
                            {schedule.doctor && (
                              <span className="text-[10px] text-gray-600">Dr. {schedule.doctor}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="w-[10px] h-[10px] mr-1 text-gray-400" />
                              {schedule.days.join(', ')}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-[10px] h-[10px] mr-1 text-gray-400" />
                              {schedule.time}
                            </div>
                          </div>
                          {schedule.notes && (
                            <p className="mt-1 text-[10px] text-gray-500">{schedule.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location Map (if coordinates available) */}
                {selectedHospital.latitude && selectedHospital.longitude && (
                  <div className="mb-2">
                    <h3 className="text-xs font-semibold text-gray-900 mb-1.5">Location</h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-100">
                      <a
                        href={`https://www.google.com/maps?q=${selectedHospital.latitude},${selectedHospital.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 text-center hover:bg-gray-50 transition-colors"
                      >
                        <MapPin className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                        <p className="text-[10px] text-gray-600 mb-0.5">View on Google Maps</p>
                        <p className="text-[10px] text-gray-500">
                          {selectedHospital.latitude}, {selectedHospital.longitude}
                        </p>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

