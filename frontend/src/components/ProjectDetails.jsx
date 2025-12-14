import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { ArrowLeft, Calendar, Users, DollarSign } from 'lucide-react';
import Navbar from './Navbar';

// Import components
import ProjectHeader from './ProjectDetailsDir/components/ProjectHeader';
import ProductionSection from './ProjectDetailsDir/components/ProductionSection';
import WorkersSection from './ProjectDetailsDir/components/WorkersSection';
import PaymentsSection from './ProjectDetailsDir/components/PaymentsSection';
import TimelineSection from './ProjectDetailsDir/components/TimelineSection';
import ClientPortalSection from './ProjectDetailsDir/components/ClientPortalSection';

// Import modals
import AddProductModal from './ProjectDetailsDir/modals/AddProductModal';
import AddWorkerModal from './ProjectDetailsDir/modals/AddWorkerModal';
import AssignWorkerModal from './ProjectDetailsDir/modals/AssignWorkerModal';
import PasswordModal from './ProjectDetailsDir/modals/PasswordModal';
import PaymentModal from './ProjectDetailsDir/modals/PaymentModal';
import EditProjectModal from './ProjectDetailsDir/modals/EditProjectModal';
import DisplayModal from './ProjectDetailsDir/modals/DisplayModal';
import EditDimensionsModal from './ProjectDetailsDir/modals/EditDimensionsModal';
import ProductWorkersModal from './ProjectDetailsDir/modals/ProductWorkersModal'; // New modal

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuthHeader, API_URL, user } = useAuth();
  
  // State
  const [projectData, setProjectData] = useState(null);
  const [allWorkers, setAllWorkers] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [allMachines, setAllMachines] = useState([]);
  const [todayAssignments, setTodayAssignments] = useState([]);
  const [availableWorkers, setAvailableWorkers] = useState([]);
  const [payments, setPayments] = useState({ payments: [], totals: {} });
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDisplayModal, setShowDisplayModal] = useState(false);
  const [showEditDimensionsModal, setShowEditDimensionsModal] = useState(false);
  const [showProductWorkersModal, setShowProductWorkersModal] = useState(false); // New modal state

  // Form data
  const [selectedProduction, setSelectedProduction] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null); // New state for product workers modal
  const [displayForm, setDisplayForm] = useState({ displayQuantity: '', displayTarget: '' });
  const [editProjectForm, setEditProjectForm] = useState({
    name: '',
    description: '',
    status: '',
    expected_delivery_date: '',
    actual_delivery_date: '',
    client_name: '',
    client_email: '',
    client_phone: ''
  });

  useEffect(() => {
    fetchProjectDetails();
    fetchAllData();
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/projects/${id}`, {
        headers: getAuthHeader()
      });
      setProjectData(response.data);
      setEditProjectForm({
        name: response.data.project.name,
        description: response.data.project.description || '',
        status: response.data.project.status,
        project_value: response.data.project.project_value || '',
        expected_delivery_date: response.data.project.expected_delivery_date?.split('T')[0] || '',
        actual_delivery_date: response.data.project.actual_delivery_date?.split('T')[0] || '',
        client_name: response.data.project.client_name || '',
        client_email: response.data.project.client_email || '',
        client_phone: response.data.project.client_phone || ''
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching project details:', error);
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    try {
      const [workersRes, productsRes, machinesRes, assignmentsRes, availableRes, paymentsRes] = await Promise.all([
        axios.get(`${API_URL}/workers`, { headers: getAuthHeader() }),
        axios.get(`${API_URL}/products`, { headers: getAuthHeader() }),
        axios.get(`${API_URL}/machines`, { headers: getAuthHeader() }),
        axios.get(`${API_URL}/attendance/assignments/project/${id}`, { headers: getAuthHeader() }),
        axios.get(`${API_URL}/attendance/available`, { headers: getAuthHeader() }),
        axios.get(`${API_URL}/payments/project/${id}`, { headers: getAuthHeader() })
      ]);

      setAllWorkers(workersRes.data);
      setAllProducts(productsRes.data);
      setAllMachines(machinesRes.data.filter(m => m.status === 'active'));
      setTodayAssignments(assignmentsRes.data);
      setAvailableWorkers(availableRes.data);
      setPayments(paymentsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleProductWorkersClick = (product) => {
    setSelectedProduct(product);
    setShowProductWorkersModal(true);
  };

  const handleUpdateDisplayValues = async () => {
    try {
      await axios.put(
        `${API_URL}/products/production/${selectedProduction.id}/display`,
        {
          display_quantity_produced: displayForm.displayQuantity || null,
          display_target_quantity: displayForm.displayTarget || null
        },
        { headers: getAuthHeader() }
      );
      setShowDisplayModal(false);
      setSelectedProduction(null);
      setDisplayForm({ displayQuantity: '', displayTarget: '' });
      fetchProjectDetails();
    } catch (error) {
      alert('Failed to update display values');
    }
  };

  const handleUpdateProject = async () => {
    try {
      await axios.put(
        `${API_URL}/projects/${id}`,
        editProjectForm,
        { headers: getAuthHeader() }
      );
      setShowEditModal(false);
      fetchProjectDetails();
    } catch (error) {
      alert('Failed to update project');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-white text-xl">Project not found</div>
        </div>
      </div>
    );
  }

  const { project, production, workers, timeline } = projectData;
  const canEdit = user?.role === 'owner' || user?.role === 'supervisor';

  const availablePermanentWorkers = allWorkers.filter(
    w => !workers.find(pw => pw.id === w.id)
  );

  const availableProducts = allProducts.filter(
    p => !production.find(prod => prod.product_id === p.id)
  );

  // Filter available workers who are not assigned to any product today
  const unassignedAvailableWorkers = availableWorkers.filter(worker => 
    worker.status === 'present' || worker.status === 'half-day'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />

      <main className="container mx-auto px-6 py-8">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          Back to Projects
        </button>

        <ProjectHeader
          project={project}
          canEdit={canEdit}
          onEditClick={() => setShowEditModal(true)}
          formatDate={formatDate}
        />

        {/* Info Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="text-blue-400" size={20} />
              <h3 className="text-slate-400 text-sm font-medium">Start Date</h3>
            </div>
            <p className="text-xl font-bold text-white">{formatDate(project.start_date)}</p>
          </div>

          <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="text-green-400" size={20} />
              <h3 className="text-slate-400 text-sm font-medium">Expected Delivery</h3>
            </div>
            <p className="text-xl font-bold text-white">{formatDate(project.expected_delivery_date)}</p>
          </div>

          <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="text-purple-400" size={20} />
              <h3 className="text-slate-400 text-sm font-medium">Workers Today</h3>
            </div>
            <p className="text-xl font-bold text-white">{todayAssignments.length}</p>
          </div>

          <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="text-green-400" size={20} />
              <h3 className="text-slate-400 text-sm font-medium">Paid</h3>
            </div>
            <p className="text-xl font-bold text-green-400">{formatCurrency(payments.totals.total_paid || 0)}</p>
          </div>
        </div>

        {/* Client Portal Section */}
        {user?.role === 'owner' && (
          <ClientPortalSection
            project={project}
            onSetPassword={() => setShowPasswordModal(true)}
          />
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Production Section */}
          <ProductionSection
            production={production}
            canEdit={canEdit}
            onAddProduct={() => setShowAddProductModal(true)}
            fetchProjectDetails={fetchProjectDetails}
            onEditDisplay={(item) => {
              setSelectedProduction(item);
              setDisplayForm({
                displayQuantity: item.display_quantity_produced || '',
                displayTarget: item.display_target_quantity || ''
              });
              setShowDisplayModal(true);
            }}
            onEditDimensions={(item) => {
              setSelectedProduction(item);
              setShowEditDimensionsModal(true);
            }}
            onWorkersClick={handleProductWorkersClick} // Add this prop
          />

          {/* Right Column */}
          <div className="space-y-6">
            {/* Workers Section */}
            <WorkersSection
              workers={workers}
              id={id}
              canEdit={canEdit}
              onAddWorkerClick={() => setShowAddWorkerModal(true)}
              fetchProjectDetails={fetchProjectDetails}
              getAuthHeader={getAuthHeader}
              API_URL={API_URL}
              production={production}
            />
            {/* <WorkersSection
              todayAssignments={todayAssignments}
              workers={workers}
              canEdit={canEdit}
              onAssignClick={() => setShowAssignModal(true)}
              onAddWorkerClick={() => setShowAddWorkerModal(true)}
              fetchProjectDetails={fetchProjectDetails}
              fetchAllData={fetchAllData}
              getAuthHeader={getAuthHeader}
              API_URL={API_URL}
            /> */}

            {/* Payments Section */}
            <PaymentsSection
              payments={payments}
              canEdit={canEdit}
              onAddPayment={() => setShowAddPaymentModal(true)}
              fetchAllData={fetchAllData}
              getAuthHeader={getAuthHeader}
              API_URL={API_URL}
              user={user}
              formatCurrency={formatCurrency}
            />
          </div>
        </div>

        {/* Timeline Section */}
        {timeline && timeline.length > 0 && (
          <TimelineSection timeline={timeline} />
        )}
      </main>

      {/* Modals */}
      <AddProductModal
        isOpen={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
        availableProducts={availableProducts}
        id={id}
        getAuthHeader={getAuthHeader}
        API_URL={API_URL}
        fetchProjectDetails={fetchProjectDetails}
      />

      <AddWorkerModal
        isOpen={showAddWorkerModal}
        onClose={() => setShowAddWorkerModal(false)}
        availablePermanentWorkers={availablePermanentWorkers}
        id={id}
        getAuthHeader={getAuthHeader}
        API_URL={API_URL}
        fetchProjectDetails={fetchProjectDetails}
      />

      <AssignWorkerModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        unassignedAvailableWorkers={unassignedAvailableWorkers}
        allMachines={allMachines}
        id={id}
        getAuthHeader={getAuthHeader}
        API_URL={API_URL}
        fetchAllData={fetchAllData}
      />

      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        id={id}
        project={project}
        getAuthHeader={getAuthHeader}
        API_URL={API_URL}
      />

      <PaymentModal
        isOpen={showAddPaymentModal}
        onClose={() => setShowAddPaymentModal(false)}
        id={id}
        getAuthHeader={getAuthHeader}
        API_URL={API_URL}
        fetchAllData={fetchAllData}
      />

      <EditProjectModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        editProjectForm={editProjectForm}
        setEditProjectForm={setEditProjectForm}
        onUpdate={handleUpdateProject}
      />

      <DisplayModal
        isOpen={showDisplayModal}
        onClose={() => setShowDisplayModal(false)}
        selectedProduction={selectedProduction}
        displayForm={displayForm}
        setDisplayForm={setDisplayForm}
        onUpdate={handleUpdateDisplayValues}
        onReset={() => {
          setShowDisplayModal(false);
          setSelectedProduction(null);
          setDisplayForm({ displayQuantity: '', displayTarget: '' });
          fetchProjectDetails();
        }}
        getAuthHeader={getAuthHeader}
        API_URL={API_URL}
      />

      <EditDimensionsModal
        isOpen={showEditDimensionsModal}
        onClose={() => {
          setShowEditDimensionsModal(false);
          setSelectedProduction(null);
        }}
        production={selectedProduction}
        getAuthHeader={getAuthHeader}
        API_URL={API_URL}
        fetchProjectDetails={fetchProjectDetails}
      />

      {/* New Product Workers Modal */}
      <ProductWorkersModal
        isOpen={showProductWorkersModal}
        onClose={() => {
          setShowProductWorkersModal(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        projectId={id}
        getAuthHeader={getAuthHeader}
        API_URL={API_URL}
        fetchProjectDetails={fetchProjectDetails}
        unassignedAvailableWorkers={unassignedAvailableWorkers}
      />
    </div>
  );
};

export default ProjectDetails;