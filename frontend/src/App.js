import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import './App.css';

// Import shadcn components
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Alert, AlertDescription } from './components/ui/alert';
import { Badge } from './components/ui/badge';
import { Progress } from './components/ui/progress';
import { Separator } from './components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import { toast, Toaster } from 'sonner';

// Lucide icons
import { 
  Heart, 
  Phone, 
  MapPin, 
  AlertTriangle, 
  User, 
  Settings, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  SkipForward, 
  Home,
  BookOpen,
  Users,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Menu,
  LogOut,
  Plus,
  Trash2,
  Edit,
  Search,
  Navigation,
  Smartphone,
  AlertCircle,
  UserPlus
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Authentication service
class AuthService {
  static getToken() {
    return localStorage.getItem('aidly_token');
  }

  static setToken(token) {
    localStorage.setItem('aidly_token', token);
  }

  static removeToken() {
    localStorage.removeItem('aidly_token');
  }

  static isAuthenticated() {
    return !!this.getToken();
  }

  static getAuthHeaders() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

// Configure axios defaults
axios.defaults.headers.common = {
  ...axios.defaults.headers.common,
  ...AuthService.getAuthHeaders()
};

// Emergency SOS Button Component
const SOSButton = ({ onTrigger, isLoading }) => {
  const [isPressed, setIsPressed] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [longPressTimer, setLongPressTimer] = useState(null);

  const handleMouseDown = () => {
    setIsPressed(true);
    setCountdown(3);
    
    const timer = setTimeout(() => {
      onTrigger();
      setIsPressed(false);
      setCountdown(0);
    }, 3000);
    
    setLongPressTimer(timer);
    
    // Countdown
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
    setCountdown(0);
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <Button
        data-testid="sos-button"
        size="lg"
        className={`w-20 h-20 rounded-full text-white font-bold text-lg shadow-2xl transform transition-all duration-200 ${
          isPressed
            ? 'bg-red-700 scale-110 animate-pulse'
            : 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:scale-105'
        }`}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        disabled={isLoading}
      >
        {countdown > 0 ? (
          <div className="flex flex-col items-center">
            <AlertTriangle className="w-6 h-6 mb-1" />
            <span className="text-sm">{countdown}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <AlertTriangle className="w-6 h-6 mb-1" />
            <span className="text-xs">SOS</span>
          </div>
        )}
      </Button>
      {isPressed && (
        <div className="absolute bottom-24 right-0 bg-black/80 text-white px-3 py-1 rounded text-sm whitespace-nowrap">
          Hold for {countdown}s to send SOS
        </div>
      )}
    </div>
  );
};

// Landing Page Component
const LandingPage = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Heart className="w-8 h-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">Aidly</h1>
          </div>
          <Button onClick={onLogin} variant="outline" data-testid="login-button">
            Iniciar Sesión
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Asistente Médico de
            <span className="text-red-500 block">Emergencias</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Guía paso a paso para RCP, atragantamiento, quemaduras y heridas. 
            Con modo voz, detección inteligente y botón SOS para América Latina.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={onLogin}
              size="lg" 
              className="bg-red-500 hover:bg-red-600 text-lg px-8 py-4"
              data-testid="get-started-btn"
            >
              <Heart className="w-5 h-5 mr-2" />
              Comenzar Ahora
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4">
              <BookOpen className="w-5 h-5 mr-2" />
              Ver Procedimientos
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardHeader>
              <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <CardTitle>Guías de Emergencia</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Instrucciones paso a paso para RCP, atragantamiento, quemaduras y heridas con imágenes claras.
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardHeader>
              <Volume2 className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <CardTitle>Modo Voz</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Instrucciones por voz para cuando no puedas mirar la pantalla durante una emergencia.
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardHeader>
              <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <CardTitle>Botón SOS</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Llama automáticamente a emergencias y envía SMS con ubicación a tus contactos de emergencia.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-red-500 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-6">¿Listo para salvar vidas?</h3>
          <p className="text-xl mb-8 opacity-90">
            Únete a miles de usuarios que ya confían en Aidly para emergencias médicas.
          </p>
          <Button 
            onClick={onLogin}
            size="lg" 
            variant="secondary"
            className="bg-white text-red-500 hover:bg-gray-100 text-lg px-8 py-4"
            data-testid="cta-join-button"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Únete Ahora - Gratis
          </Button>
        </div>
      </section>
    </div>
  );
};

// Medical Procedure Component
const MedicalProcedure = ({ procedure, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTimer(timer => timer + 1);
      }, 1000);
    } else if (!isRunning && timer !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning, timer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const handleVoiceToggle = () => {
    setIsVoiceMode(!isVoiceMode);
    if (!isVoiceMode) {
      const currentStepData = procedure.steps[currentStep];
      speak(`${currentStepData.title}. ${currentStepData.description}`);
    } else {
      speechSynthesis.cancel();
    }
  };

  const nextStep = () => {
    if (currentStep < procedure.steps.length - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      if (isVoiceMode) {
        const stepData = procedure.steps[newStep];
        speak(`Paso ${newStep + 1}. ${stepData.title}. ${stepData.description}`);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      if (isVoiceMode) {
        const stepData = procedure.steps[newStep];
        speak(`Paso ${newStep + 1}. ${stepData.title}. ${stepData.description}`);
      }
    }
  };

  const currentStepData = procedure.steps[currentStep];
  const progress = ((currentStep + 1) / procedure.steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b sticky top-0 bg-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{procedure.name}</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleVoiceToggle}
                data-testid="voice-toggle-btn"
              >
                {isVoiceMode ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between items-center mt-4">
            <Badge variant="secondary">Paso {currentStep + 1} de {procedure.steps.length}</Badge>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">{formatTime(timer)}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRunning(!isRunning)}
                data-testid="timer-toggle-btn"
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step Image */}
          {procedure.images && procedure.images.length > 0 && (
            <div className="mb-6">
              <img
                src={procedure.images[0]}
                alt={currentStepData.title}
                className="w-full h-48 object-cover rounded-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Step Content */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {currentStepData.title}
            </h3>
            <p className="text-gray-700 text-lg leading-relaxed">
              {currentStepData.description}
            </p>
            {currentStepData.duration > 0 && (
              <div className="mt-3 flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                Duración estimada: {currentStepData.duration} segundos
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              Anterior
            </Button>
            <Button
              onClick={nextStep}
              disabled={currentStep === procedure.steps.length - 1}
              className="bg-red-500 hover:bg-red-600"
            >
              {currentStep === procedure.steps.length - 1 ? 'Finalizar' : 'Siguiente'}
              <SkipForward className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
const Dashboard = ({ user, onLogout }) => {
  const [currentView, setCurrentView] = useState('home');
  const [procedures, setProcedures] = useState([]);
  const [selectedProcedure, setSelectedProcedure] = useState(null);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [location, setLocation] = useState(null);
  const [isLoadingSOS, setIsLoadingSOS] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relationship: '' });

  useEffect(() => {
    loadProcedures();
    loadEmergencyContacts();
    requestLocation();
  }, []);

  const loadProcedures = async () => {
    try {
      const response = await axios.get(`${API}/medical-procedures`);
      setProcedures(response.data);
    } catch (error) {
      console.error('Error loading procedures:', error);
      toast.error('Error al cargar procedimientos médicos');
    }
  };

  const loadEmergencyContacts = async () => {
    try {
      const response = await axios.get(`${API}/emergency-contacts`);
      setEmergencyContacts(response.data);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const requestLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          console.error('Location error:', error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    }
  };

  const handleSOS = async () => {
    setIsLoadingSOS(true);
    try {
      // Get fresh location
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const currentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };

          const response = await axios.post(`${API}/emergency/sos`, {
            emergency_type: 'medical',
            location: currentLocation,
            custom_message: 'Emergencia médica - necesito ayuda inmediata'
          });

          toast.success(`SOS enviado. ${response.data.contacts_notified} contactos notificados.`);
          
          // Try to call emergency services
          if (response.data.emergency_number) {
            const confirmCall = window.confirm(
              `¿Deseas llamar al ${response.data.emergency_number} ahora?`
            );
            if (confirmCall) {
              window.location.href = `tel:${response.data.emergency_number}`;
            }
          }
        });
      } else {
        // Send SOS without location
        const response = await axios.post(`${API}/emergency/sos`, {
          emergency_type: 'medical',
          custom_message: 'Emergencia médica - necesito ayuda inmediata'
        });
        toast.success(`SOS enviado. ${response.data.contacts_notified} contactos notificados.`);
      }
    } catch (error) {
      console.error('SOS error:', error);
      toast.error('Error al enviar SOS. Intenta nuevamente.');
    } finally {
      setIsLoadingSOS(false);
    }
  };

  const addEmergencyContact = async () => {
    try {
      await axios.post(`${API}/emergency-contacts`, newContact);
      setNewContact({ name: '', phone: '', relationship: '' });
      setShowAddContact(false);
      loadEmergencyContacts();
      toast.success('Contacto de emergencia agregado');
    } catch (error) {
      console.error('Error adding contact:', error);
      toast.error('Error al agregar contacto');
    }
  };

  const deleteEmergencyContact = async (contactId) => {
    try {
      await axios.delete(`${API}/emergency-contacts/${contactId}`);
      loadEmergencyContacts();
      toast.success('Contacto eliminado');
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Error al eliminar contacto');
    }
  };

  const renderHome = () => (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500" />
            Bienvenido, {user.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Aidly está listo para ayudarte en emergencias médicas. Revisa los procedimientos y asegúrate de tener tus contactos de emergencia actualizados.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Procedimientos cargados</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {location ? (
                <><CheckCircle className="w-4 h-4 text-green-500" /><span>Ubicación disponible</span></>
              ) : (
                <><XCircle className="w-4 h-4 text-red-500" /><span>Ubicación no disponible</span></>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              {emergencyContacts.length > 0 ? (
                <><CheckCircle className="w-4 h-4 text-green-500" /><span>{emergencyContacts.length} contactos</span></>
              ) : (
                <><AlertCircle className="w-4 h-4 text-orange-500" /><span>Sin contactos</span></>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Modo offline listo</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView('procedures')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Heart className="w-5 h-5" />
              Emergencias Médicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">RCP, atragantamiento, quemaduras y heridas</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView('contacts')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Users className="w-5 h-5" />
              Contactos de Emergencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Gestiona tus contactos de emergencia</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderProcedures = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Procedimientos Médicos</h2>
        <Button variant="outline" onClick={() => setCurrentView('home')}>
          <Home className="w-4 h-4 mr-2" />
          Inicio
        </Button>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {procedures.map((procedure) => (
          <Card key={procedure.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedProcedure(procedure)}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{procedure.name}</CardTitle>
                <Badge variant={procedure.difficulty === 'basic' ? 'secondary' : 'default'}>
                  {procedure.difficulty === 'basic' ? 'Básico' : procedure.difficulty === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{procedure.description}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{procedure.duration_minutes} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  <span>{procedure.steps.length} pasos</span>
                </div>
              </div>
              {procedure.images && procedure.images.length > 0 && (
                <div className="mt-4">
                  <img
                    src={procedure.images[0]}
                    alt={procedure.name}
                    className="w-full h-32 object-cover rounded"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderContacts = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Contactos de Emergencia</h2>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddContact(true)} data-testid="add-contact-btn">
            <Plus className="w-4 h-4 mr-2" />
            Agregar
          </Button>
          <Button variant="outline" onClick={() => setCurrentView('home')}>
            <Home className="w-4 h-4 mr-2" />
            Inicio
          </Button>
        </div>
      </div>
      
      {emergencyContacts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay contactos de emergencia</h3>
            <p className="text-gray-600 mb-4">Agrega contactos para que reciban alertas SOS automáticamente</p>
            <Button onClick={() => setShowAddContact(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar primer contacto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {emergencyContacts.map((contact) => (
            <Card key={contact.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{contact.name}</h3>
                    <p className="text-sm text-gray-600">{contact.relationship}</p>
                    <p className="text-sm text-gray-500">{contact.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Prioridad {contact.priority}</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `tel:${contact.phone}`}
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteEmergencyContact(contact.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Add Contact Dialog */}
      {showAddContact && (
        <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Contacto de Emergencia</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={newContact.name}
                  onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <Label htmlFor="relationship">Relación</Label>
                <Input
                  id="relationship"
                  value={newContact.relationship}
                  onChange={(e) => setNewContact({...newContact, relationship: e.target.value})}
                  placeholder="Familiar, amigo, etc."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddContact(false)}>
                  Cancelar
                </Button>
                <Button onClick={addEmergencyContact} disabled={!newContact.name || !newContact.phone}>
                  Agregar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Heart className="w-8 h-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">Aidly</h1>
            </div>
            <div className="flex items-center gap-4">
              {location && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>Ubicación activa</span>
                </div>
              )}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Menu className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Avatar>
                        <AvatarImage src={user.profile_picture} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {user.name}
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    <Button variant="ghost" className="w-full justify-start" onClick={() => setCurrentView('home')}>
                      <Home className="w-4 h-4 mr-2" />
                      Inicio
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" onClick={() => setCurrentView('procedures')}>
                      <BookOpen className="w-4 h-4 mr-2" />
                      Procedimientos
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" onClick={() => setCurrentView('contacts')}>
                      <Users className="w-4 h-4 mr-2" />
                      Contactos
                    </Button>
                    <Separator />
                    <Button variant="ghost" className="w-full justify-start text-red-600" onClick={onLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Cerrar Sesión
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentView === 'home' && renderHome()}
        {currentView === 'procedures' && renderProcedures()}
        {currentView === 'contacts' && renderContacts()}
      </main>

      {/* SOS Button */}
      <SOSButton onTrigger={handleSOS} isLoading={isLoadingSOS} />
      
      {/* Medical Procedure Modal */}
      {selectedProcedure && (
        <MedicalProcedure
          procedure={selectedProcedure}
          onClose={() => setSelectedProcedure(null)}
        />
      )}
    </div>
  );
};

// Main App Component
const App = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    checkAuth();
    handleAuthCallback();
  }, []);

  const checkAuth = async () => {
    const token = AuthService.getToken();
    if (token) {
      try {
        const response = await axios.get(`${API}/profile`);
        setUser(response.data);
      } catch (error) {
        console.error('Auth check failed:', error);
        AuthService.removeToken();
      }
    }
    setIsLoading(false);
  };

  const handleAuthCallback = () => {
    const hash = window.location.hash;
    if (hash.includes('session_id=')) {
      const sessionId = hash.split('session_id=')[1].split('&')[0];
      processSession(sessionId);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const processSession = async (sessionId) => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${API}/auth/session-data`, 
        { session_id: sessionId },
        { headers: { 'X-Session-ID': sessionId } }
      );
      
      AuthService.setToken(response.data.session_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.session_token}`;
      
      setUser({
        id: response.data.id,
        email: response.data.email,
        name: response.data.name,
        profile_picture: response.data.picture
      });
      
      toast.success(`¡Bienvenido, ${response.data.name}!`);
    } catch (error) {
      console.error('Session processing failed:', error);
      toast.error('Error al procesar la sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    const redirectUrl = encodeURIComponent(window.location.origin);
    window.location.href = `https://auth.emergentagent.com/?redirect=${redirectUrl}`;
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      AuthService.removeToken();
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      toast.success('Sesión cerrada');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-12 h-12 text-red-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Cargando Aidly...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="App">
        {user ? (
          <Dashboard user={user} onLogout={handleLogout} />
        ) : (
          <LandingPage onLogin={handleLogin} />
        )}
        <Toaster position="top-right" />
      </div>
    </BrowserRouter>
  );
};

export default App;
