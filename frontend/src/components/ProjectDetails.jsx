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

  // Form data
  const [selectedProduction, setSelectedProduction] = useState(null);
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

  const unassignedAvailableWorkers = availableWorkers.filter(
    w => !todayAssignments.find(a => a.worker_id === w.id)
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
          />

          {/* Right Column */}
          <div className="space-y-6">
            {/* Workers Section */}
            <WorkersSection
              todayAssignments={todayAssignments}
              workers={workers}
              canEdit={canEdit}
              onAssignClick={() => setShowAssignModal(true)}
              onAddWorkerClick={() => setShowAddWorkerModal(true)}
              fetchProjectDetails={fetchProjectDetails}
              fetchAllData={fetchAllData}
              getAuthHeader={getAuthHeader}
              API_URL={API_URL}
            />

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
    </div>
  );
};

export default ProjectDetails;

// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import axios from 'axios';
// import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
// import Navbar from './Navbar';
// import { 
//   ArrowLeft, Package, Users, Calendar, TrendingUp, Edit, UserPlus, X, UserMinus, 
//   Plus, Trash2, Key, Copy, DollarSign, Clock, CheckCircle, Eye
// } from 'lucide-react';

// const ProjectDetails = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const { getAuthHeader, API_URL, user } = useAuth();
  
//   // State
//   const [projectData, setProjectData] = useState(null);
//   const [allWorkers, setAllWorkers] = useState([]);
//   const [allProducts, setAllProducts] = useState([]);
//   const [allMachines, setAllMachines] = useState([]);
//   const [todayAssignments, setTodayAssignments] = useState([]);
//   const [availableWorkers, setAvailableWorkers] = useState([]);
//   const [payments, setPayments] = useState({ payments: [], totals: {} });
//   const [loading, setLoading] = useState(true);
  
//   // Modals
//   const [showAddProductModal, setShowAddProductModal] = useState(false);
//   const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
//   const [showAssignModal, setShowAssignModal] = useState(false);
//   const [showPasswordModal, setShowPasswordModal] = useState(false);
//   const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);

//   // Add new state for display modal
//   const [showDisplayModal, setShowDisplayModal] = useState(false);
//   const [selectedProduction, setSelectedProduction] = useState(null);
//   const [displayForm, setDisplayForm] = useState({ displayQuantity: '', displayTarget: '' });
  
//   // Form data
//   const [editingProduction, setEditingProduction] = useState(null);
// //   const [editValue, setEditValue] = useState({ quantity: '', workers: '' });
//     const [editValue, setEditValue] = useState({ 
//     quantity: '',
//     target: '',
//     workers: '',
//     displayQuantity: '',
//     displayTarget: ''
//     });
//   const [productForm, setProductForm] = useState({ product_id: '', target_quantity: '' });
//   const [selectedWorkerId, setSelectedWorkerId] = useState('');
//   const [assignmentForm, setAssignmentForm] = useState({ worker_id: '', machine_id: '', notes: '' });
//   const [clientPassword, setClientPassword] = useState('');
//   const [paymentForm, setPaymentForm] = useState({
//     amount: '',
//     payment_type: 'advance',
//     payment_method: 'Bank Transfer',
//     payment_date: new Date().toISOString().split('T')[0],
//     transaction_reference: '',
//     notes: ''
//   });
//   const [editProjectForm, setEditProjectForm] = useState({
//     name: '',
//     description: '',
//     status: '',
//     expected_delivery_date: '',
//     actual_delivery_date: '',
//     client_name: '',
//     client_email: '',
//     client_phone: ''
//   });

//   useEffect(() => {
//     fetchProjectDetails();
//     fetchAllData();
//   }, [id]);

//   const fetchProjectDetails = async () => {
//   try {
//     const response = await axios.get(`${API_URL}/projects/${id}`, {
//       headers: getAuthHeader()
//     });
//     setProjectData(response.data);
//     setEditProjectForm({
//       name: response.data.project.name,
//       description: response.data.project.description || '',
//       status: response.data.project.status,
//       project_value: response.data.project.project_value || '',
//       expected_delivery_date: response.data.project.expected_delivery_date?.split('T')[0] || '',
//       actual_delivery_date: response.data.project.actual_delivery_date?.split('T')[0] || '',
//       client_name: response.data.project.client_name || '',
//       client_email: response.data.project.client_email || '',
//       client_phone: response.data.project.client_phone || ''
//     });
//     setLoading(false);
//   } catch (error) {
//     console.error('Error fetching project details:', error);
//     setLoading(false);
//   }
// };

//   const fetchAllData = async () => {
//     try {
//       const [workersRes, productsRes, machinesRes, assignmentsRes, availableRes, paymentsRes] = await Promise.all([
//         axios.get(`${API_URL}/workers`, { headers: getAuthHeader() }),
//         axios.get(`${API_URL}/products`, { headers: getAuthHeader() }),
//         axios.get(`${API_URL}/machines`, { headers: getAuthHeader() }),
//         axios.get(`${API_URL}/attendance/assignments/project/${id}`, { headers: getAuthHeader() }),
//         axios.get(`${API_URL}/attendance/available`, { headers: getAuthHeader() }),
//         axios.get(`${API_URL}/payments/project/${id}`, { headers: getAuthHeader() })
//       ]);

//       setAllWorkers(workersRes.data);
//       setAllProducts(productsRes.data);
//       setAllMachines(machinesRes.data.filter(m => m.status === 'active'));
//       setTodayAssignments(assignmentsRes.data);
//       setAvailableWorkers(availableRes.data);
//       setPayments(paymentsRes.data);
//     } catch (error) {
//       console.error('Error fetching data:', error);
//     }
//   };

//   // Handlers
//   // Update the handleUpdateProduction function:
// const handleUpdateProduction = async (productionId) => {
//   try {
//     const updateData = {};
//     if (editValue.quantity !== '') updateData.quantity_produced = parseInt(editValue.quantity);
//     // if (editValue.target_quantity !== '') updateData.target_quantity = parseInt(editValue.target);
//     if (editValue.workers !== '') updateData.assigned_workers = parseInt(editValue.workers);
//     if(editValue.target !== '') updateData.target_quantity = parseInt(editValue.target);
    
//     // Only send display values if they're different from actual
//     if (editValue.displayQuantity !== '' && editValue.displayQuantity !== editValue.quantity) {
//       updateData.display_quantity_produced = parseInt(editValue.displayQuantity);
//     } else if (editValue.displayQuantity === '') {
//       // Clear display override if empty
//       updateData.display_quantity_produced = null;
//     }
    
//     if (editValue.displayTarget !== '') {
//       updateData.display_target_quantity = parseInt(editValue.displayTarget);
//     } else {
//       updateData.display_target_quantity = null;
//     }

//     await axios.put(
//       `${API_URL}/products/production/${productionId}`,
//       updateData,
//       { headers: getAuthHeader() }
//     );
//     setEditingProduction(null);
//     setEditValue({ quantity: '', target:'', workers: '', displayQuantity: '', displayTarget: '' });
//     fetchProjectDetails();
//   } catch (error) {
//     alert('Failed to update production');
//   }
// };
// //   const handleUpdateProduction = async (productionId) => {
// //     try {
// //       const updateData = {};
// //       if (editValue.quantity !== '') updateData.quantity_produced = parseInt(editValue.quantity);
// //       if (editValue.workers !== '') updateData.assigned_workers = parseInt(editValue.workers);

// //       await axios.put(
// //         `${API_URL}/products/production/${productionId}`,
// //         updateData,
// //         { headers: getAuthHeader() }
// //       );
// //       setEditingProduction(null);
// //       fetchProjectDetails();
// //     } catch (error) {
// //       alert('Failed to update production');
// //     }
// //   };

//   const handleAddProduct = async () => {
//     try {
//       await axios.post(
//         `${API_URL}/projects/${id}/products`,
//         productForm,
//         { headers: getAuthHeader() }
//       );
//       setShowAddProductModal(false);
//       setProductForm({ product_id: '', target_quantity: '' });
//       fetchProjectDetails();
//     } catch (error) {
//       alert(error.response?.data?.error || 'Failed to add product');
//     }
//   };

//   const handleRemoveProduct = async (productionId) => {
//     if (!window.confirm('Remove this product from project?')) return;
    
//     try {
//       await axios.delete(
//         `${API_URL}/products/production/${productionId}`,
//         { headers: getAuthHeader() }
//       );
//       fetchProjectDetails();
//     } catch (error) {
//       alert('Failed to remove product');
//     }
//   };

//   const handleAddPermanentWorker = async () => {
//     try {
//       await axios.post(
//         `${API_URL}/projects/${id}/workers`,
//         { worker_id: selectedWorkerId },
//         { headers: getAuthHeader() }
//       );
//       setShowAddWorkerModal(false);
//       setSelectedWorkerId('');
//       fetchProjectDetails();
//     } catch (error) {
//       alert('Failed to add worker');
//     }
//   };

//   const handleRemovePermanentWorker = async (workerId) => {
//     if (!window.confirm('Remove this worker from project?')) return;
    
//     try {
//       await axios.delete(
//         `${API_URL}/projects/${id}/workers/${workerId}`,
//         { headers: getAuthHeader() }
//       );
//       fetchProjectDetails();
//     } catch (error) {
//       alert('Failed to remove worker');
//     }
//   };

//   const handleAssignWorker = async () => {
//     if (!assignmentForm.worker_id) {
//       alert('Please select a worker');
//       return;
//     }

//     try {
//       await axios.post(
//         `${API_URL}/attendance/assign`,
//         {
//           worker_id: assignmentForm.worker_id,
//           project_id: id,
//           machine_id: assignmentForm.machine_id || null,
//           notes: assignmentForm.notes
//         },
//         { headers: getAuthHeader() }
//       );
      
//       setShowAssignModal(false);
//       setAssignmentForm({ worker_id: '', machine_id: '', notes: '' });
//       fetchAllData();
//     } catch (error) {
//       alert(error.response?.data?.error || 'Failed to assign worker');
//     }
//   };

//   const handleRemoveAssignment = async (assignmentId) => {
//     if (!window.confirm('Remove this worker assignment?')) return;

//     try {
//       await axios.delete(
//         `${API_URL}/attendance/assignments/${assignmentId}`,
//         { headers: getAuthHeader() }
//       );
//       fetchAllData();
//     } catch (error) {
//       alert('Failed to remove assignment');
//     }
//   };

//   const handleSetClientPassword = async () => {
//     if (clientPassword.length < 6) {
//       alert('Password must be at least 6 characters');
//       return;
//     }

//     try {
//       await axios.post(
//         `${API_URL}/projects/${id}/client-password`,
//         { password: clientPassword },
//         { headers: getAuthHeader() }
//       );
//       alert('Client password set successfully!');
//       setShowPasswordModal(false);
//       setClientPassword('');
//     } catch (error) {
//       alert('Failed to set password');
//     }
//   };

//   const handleAddPayment = async () => {
//     try {
//       await axios.post(
//         `${API_URL}/payments`,
//         { ...paymentForm, project_id: id },
//         { headers: getAuthHeader() }
//       );
//       setShowAddPaymentModal(false);
//       setPaymentForm({
//         amount: '',
//         payment_type: 'advance',
//         payment_method: 'Bank Transfer',
//         payment_date: new Date().toISOString().split('T')[0],
//         transaction_reference: '',
//         notes: ''
//       });
//       fetchAllData();
//     } catch (error) {
//       alert('Failed to add payment');
//     }
//   };

//   const handleDeletePayment = async (paymentId) => {
//     if (!window.confirm('Delete this payment record?')) return;

//     try {
//       await axios.delete(`${API_URL}/payments/${paymentId}`, {
//         headers: getAuthHeader()
//       });
//       fetchAllData();
//     } catch (error) {
//       alert('Failed to delete payment');
//     }
//   };

//   const handleUpdateProject = async () => {
//     try {
//       await axios.put(
//         `${API_URL}/projects/${id}`,
//         editProjectForm,
//         { headers: getAuthHeader() }
//       );
//       setShowEditModal(false);
//       fetchProjectDetails();
//     } catch (error) {
//       alert('Failed to update project');
//     }
//   };

//   // Add this handler function
// const handleUpdateDisplayValues = async () => {
//   try {
//     await axios.put(
//       `${API_URL}/products/production/${selectedProduction.id}/display`,
//       {
//         display_quantity_produced: displayForm.displayQuantity || null,
//         display_target_quantity: displayForm.displayTarget || null
//       },
//       { headers: getAuthHeader() }
//     );
//     setShowDisplayModal(false);
//     setSelectedProduction(null);
//     setDisplayForm({ displayQuantity: '', displayTarget: '' });
//     fetchProjectDetails();
//   } catch (error) {
//     alert('Failed to update display values');
//   }
// };

//   const copyToClipboard = (text) => {
//     navigator.clipboard.writeText(text);
//     alert('Copied to clipboard!');
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
//         <Navbar />
//         <div className="flex items-center justify-center h-96">
//           <div className="text-white text-xl">Loading...</div>
//         </div>
//       </div>
//     );
//   }

//   if (!projectData) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
//         <Navbar />
//         <div className="flex items-center justify-center h-96">
//           <div className="text-white text-xl">Project not found</div>
//         </div>
//       </div>
//     );
//   }

//   const { project, production, workers, timeline } = projectData;

//   const chartData = production.map((item) => ({
//     name: item.product_name,
//     value: parseInt(item.quantity_produced),
//   }));

//   const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

//   const canEdit = user?.role === 'owner' || user?.role === 'supervisor';

//   const formatDate = (dateString) => {
//     if (!dateString) return 'Not set';
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
//   };

//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       maximumFractionDigits: 0
//     }).format(amount);
//   };

//   const statusColors = {
//     'pitching': 'bg-purple-500',
//     'received': 'bg-blue-500',
//     'started': 'bg-green-500',
//     'on-hold': 'bg-yellow-500',
//     'finished-production': 'bg-teal-500',
//     'payment-pending': 'bg-orange-500',
//     'closed': 'bg-gray-500'
//   };

//   const attendanceStatusColors = {
//     present: 'bg-green-500 text-green-100',
//     absent: 'bg-red-500 text-red-100',
//     'half-day': 'bg-yellow-500 text-yellow-100'
//   };

//   const unassignedAvailableWorkers = availableWorkers.filter(
//     w => !todayAssignments.find(a => a.worker_id === w.id)
//   );

//   const availablePermanentWorkers = allWorkers.filter(
//     w => !workers.find(pw => pw.id === w.id)
//   );

//   const availableProducts = allProducts.filter(
//     p => !production.find(prod => prod.product_id === p.id)
//   );

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
//       <Navbar />

//       <main className="container mx-auto px-6 py-8">
//         <button
//           onClick={() => navigate('/projects')}
//           className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors mb-6"
//         >
//           <ArrowLeft size={20} />
//           Back to Projects
//         </button>

//         {/* Project Header */}
//         <div className="flex justify-between items-start mb-6">
//           <div className="flex-1">
//             <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
//             <p className="text-slate-400">{project.description}</p>
//             {project.client_name && (
//               <p className="text-slate-500 mt-2">Client: {project.client_name}</p>
//             )}
//           </div>
//           <div className="flex gap-3">
//             <span
//               className={`px-4 py-2 rounded-full text-sm font-medium text-white ${
//                 statusColors[project.status] || 'bg-gray-500'
//               }`}
//             >
//               {project.status}
//             </span>
//             {canEdit && (
//               <button
//                 onClick={() => setShowEditModal(true)}
//                 className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
//               >
//                 <Edit size={16} />
//                 Edit
//               </button>
//             )}
//           </div>
//         </div>

//         {/* Project Info Cards */}
//         <div className="grid md:grid-cols-4 gap-6 mb-8">
//           <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
//             <div className="flex items-center gap-2 mb-2">
//               <Calendar className="text-blue-400" size={20} />
//               <h3 className="text-slate-400 text-sm font-medium">Start Date</h3>
//             </div>
//             <p className="text-xl font-bold text-white">{formatDate(project.start_date)}</p>
//           </div>

//           <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
//             <div className="flex items-center gap-2 mb-2">
//               <Calendar className="text-green-400" size={20} />
//               <h3 className="text-slate-400 text-sm font-medium">Expected Delivery</h3>
//             </div>
//             <p className="text-xl font-bold text-white">{formatDate(project.expected_delivery_date)}</p>
//           </div>

//           <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
//             <div className="flex items-center gap-2 mb-2">
//               <Users className="text-purple-400" size={20} />
//               <h3 className="text-slate-400 text-sm font-medium">Workers Today</h3>
//             </div>
//             <p className="text-xl font-bold text-white">{todayAssignments.length}</p>
//           </div>

//           <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
//             <div className="flex items-center gap-2 mb-2">
//               <DollarSign className="text-green-400" size={20} />
//               <h3 className="text-slate-400 text-sm font-medium">Paid</h3>
//             </div>
//             <p className="text-xl font-bold text-green-400">{formatCurrency(payments.totals.total_paid || 0)}</p>
//           </div>
//         </div>

//         {/* Client Portal Access */}
//         {user?.role === 'owner' && (
//           <div className="bg-blue-500 bg-opacity-10 border border-blue-500 rounded-xl p-6 mb-8">
//             <div className="flex justify-between items-start">
//               <div className="flex-1">
//                 <div className="flex items-center gap-2 mb-3">
//                   <Key className="text-blue-400" size={24} />
//                   <h3 className="text-xl font-bold text-white">Client Portal Access</h3>
//                 </div>
//                 <div className="grid md:grid-cols-2 gap-4">
//                   <div>
//                     <p className="text-slate-400 text-sm mb-1">Project ID</p>
//                     <div className="flex items-center gap-2">
//                       <code className="px-3 py-2 bg-slate-900 rounded text-blue-300 font-mono">{project.id}</code>
//                       <button
//                         onClick={() => copyToClipboard(project.id.toString())}
//                         className="p-2 hover:bg-slate-700 rounded transition-colors"
//                       >
//                         <Copy className="text-slate-400" size={16} />
//                       </button>
//                     </div>
//                   </div>
//                   <div>
//                     <p className="text-slate-400 text-sm mb-1">Portal URL</p>
//                     <div className="flex items-center gap-2">
//                       <code className="px-3 py-2 bg-slate-900 rounded text-blue-300 font-mono text-sm">/client/login</code>
//                       <button
//                         onClick={() => copyToClipboard(`${window.location.origin}/client/login`)}
//                         className="p-2 hover:bg-slate-700 rounded transition-colors"
//                       >
//                         <Copy className="text-slate-400" size={16} />
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//               <button
//                 onClick={() => setShowPasswordModal(true)}
//                 className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
//               >
//                 <Key size={16} />
//                 Set Password
//               </button>
//             </div>
//           </div>
//         )}

//         <div className="grid lg:grid-cols-2 gap-8">
//           {/* Production Details */}
//           <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
//             <div className="flex items-center justify-between mb-6">
//               <div className="flex items-center gap-2">
//                 <Package className="text-blue-400" size={24} />
//                 <h2 className="text-2xl font-bold text-white">Production</h2>
//               </div>
//               {canEdit && (
//                 <button
//                   onClick={() => setShowAddProductModal(true)}
//                   className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-1"
//                 >
//                   <Plus size={16} />
//                   Add Product
//                 </button>
//               )}
//             </div>

//             {production.length === 0 ? (
//               <div className="text-center py-12">
//                 <Package className="text-slate-600 mx-auto mb-3" size={48} />
//                 <p className="text-slate-400 mb-4">No products added yet</p>
//                 {canEdit && (
//                   <button
//                     onClick={() => setShowAddProductModal(true)}
//                     className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
//                   >
//                     Add First Product
//                   </button>
//                 )}
//               </div>
//             ) : (
//               <>
//                 <div className="space-y-4 mb-6">
//                     {production.map((item) => (
//                     <div
//                         key={item.id}
//                         className="bg-slate-900 bg-opacity-50 rounded-lg p-4 border border-slate-700"
//                     >
//                         <div className="flex justify-between items-start mb-2">
//                         <div className="flex-1">
//                             <div className="flex items-center justify-between">
//                             <h4 className="text-white font-medium">{item.product_name}</h4>
//                             <div className="flex items-center gap-2">
//                                 <span className="px-3 py-1 bg-blue-500 bg-opacity-20 text-blue-300 rounded-full text-sm font-medium">
//                                 {item.completion_percentage}% actual
//                                 </span>
//                                 {(item.display_quantity_produced || item.display_target_quantity) && (
//                                 <span className="px-3 py-1 bg-green-500 bg-opacity-20 text-green-300 rounded-full text-sm font-medium">
//                                     {item.display_completion_percentage}% shown
//                                 </span>
//                                 )}
//                                 {canEdit && user?.role === 'owner' && (
//                                 <button
//                                     onClick={() => handleRemoveProduct(item.id)}
//                                     className="p-1 hover:bg-red-600 hover:bg-opacity-20 text-red-400 rounded"
//                                 >
//                                     <Trash2 size={14} />
//                                 </button>
//                                 )}
//                             </div>
//                             </div>
//                             <p className="text-sm text-slate-400 capitalize">{item.product_type}</p>
//                         </div>
//                         </div>

//                         <div className="space-y-3">
//                         {editingProduction === item.id && canEdit ? (
//                             <div className="space-y-2 bg-slate-800 p-3 rounded-lg">
//                                 <div className="grid grid-cols-2 gap-3">
//                                 {/* Actual Values Column */}
//                                 <div className="space-y-2">
//                                     <p className="text-xs font-semibold text-blue-300 uppercase">Actual Values</p>
//                                     <div className="flex items-center gap-2">
//                                     <label className="text-slate-400 text-xs w-20">Quantity:</label>
//                                     <input
//                                         type="number"
//                                         value={editValue.quantity}
//                                         onChange={(e) => setEditValue({...editValue, quantity: e.target.value})}
//                                         placeholder={item.quantity_produced}
//                                         className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
//                                     />
//                                     </div>
//                                     <div className="flex items-center gap-2">
//                                     <label className="text-slate-400 text-xs w-20">Target:</label>
//                                     <input
//                                         type="number"
//                                         value={editValue.target}
//                                         // disabled
//                                         onChange={(e) => setEditValue({...editValue, target: e.target.value})}
//                                         placeholder={item.target_quantity}
//                                         className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
//                                         // className="flex-1 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-500 text-sm"
//                                     />
//                                     </div>
//                                     <div className="flex items-center gap-2">
//                                     <label className="text-slate-400 text-xs w-20">Workers:</label>
//                                     <input
//                                         type="number"
//                                         value={editValue.workers}
//                                         onChange={(e) => setEditValue({...editValue, workers: e.target.value})}
//                                         placeholder={item.assigned_workers || 0}
//                                         className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
//                                     />
//                                     </div>
//                                 </div>

//                                 {/* Display Values Info */}
//                                 <div className="space-y-2 border-l border-slate-700 pl-3">
//                                     <p className="text-xs font-semibold text-green-300 uppercase">Client View</p>
//                                     <div className="text-xs text-slate-400 space-y-1">
//                                     <div>Quantity: {item.display_quantity || item.quantity_produced}</div>
//                                     <div>Target: {item.display_target || item.target_quantity}</div>
//                                     <div>Progress: {item.display_completion_percentage}%</div>
//                                     </div>
//                                     {user?.role === 'owner' && (
//                                     <button
//                                         onClick={() => {
//                                         setSelectedProduction(item);
//                                         setDisplayForm({
//                                             displayQuantity: item.display_quantity_produced || '',
//                                             displayTarget: item.display_target_quantity || ''
//                                         });
//                                         setShowDisplayModal(true);
//                                         }}
//                                         className="w-full py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
//                                     >
//                                         Configure Display
//                                     </button>
//                                     )}
//                                 </div>
//                                 </div>

//                                 <div className="flex gap-2 mt-3">
//                                 <button
//                                     onClick={() => handleUpdateProduction(item.id)}
//                                     className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex-1"
//                                 >
//                                     Save Changes
//                                 </button>
//                                 <button
//                                     onClick={() => {
//                                     setEditingProduction(null);
//                                     setEditValue({ quantity: '', target: '', workers: '' });
//                                     }}
//                                     className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm"
//                                 >
//                                     Cancel
//                                 </button>
//                                 </div>
//                             </div>
//                             ) : (
//                             <div>
//                                 <div className="flex items-center justify-between mb-2">
//                                 <div className="flex-1">
//                                     <div className="flex items-center gap-3 mb-1">
//                                     <span className="text-slate-300 text-sm">
//                                         Actual: {item.quantity_produced} / {item.target_quantity} {item.product_unit}
//                                     </span>
//                                     {(item.display_quantity_produced || item.display_target_quantity) && (
//                                         <span className="text-green-300 text-sm">
//                                         Client sees: {item.display_quantity} / {item.display_target} {item.product_unit}
//                                         </span>
//                                     )}
//                                     </div>
//                                     <div className="text-slate-400 text-xs">
//                                     Workers assigned: {item.assigned_workers || 0}
//                                     </div>
//                                 </div>
//                                 {canEdit && (
//                                     <div className="flex gap-1">
//                                     <button
//                                         onClick={() => {
//                                         setEditingProduction(item.id);
//                                         setEditValue({ 
//                                             quantity: item.quantity_produced, 
//                                             workers: item.assigned_workers || 0,
//                                             target: item.target_quantity,
//                                         });
//                                         }}
//                                         className="p-1 hover:bg-slate-700 rounded transition-colors"
//                                         title="Edit production"
//                                     >
//                                         <Edit className="text-slate-400" size={16} />
//                                     </button>
//                                     {user?.role === 'owner' && (
//                                         <button
//                                         onClick={() => {
//                                             setSelectedProduction(item);
//                                             setDisplayForm({
//                                             displayQuantity: item.display_quantity_produced || '',
//                                             displayTarget: item.display_target_quantity || ''
//                                             });
//                                             setShowDisplayModal(true);
//                                         }}
//                                         className="p-1 hover:bg-green-600 hover:bg-opacity-20 rounded transition-colors"
//                                         title="Configure client display"
//                                         >
//                                         <Eye className="text-green-400" size={16} />
//                                         </button>
//                                     )}
//                                     </div>
//                                 )}
//                                 </div>

//                                 {/* Progress bars */}
//                                 <div className="space-y-2">
//                                 <div>
//                                     <div className="flex justify-between items-center mb-1">
//                                     <span className="text-xs text-slate-400">Actual Progress</span>
//                                     <span className="text-xs text-blue-300">{item.completion_percentage}%</span>
//                                     </div>
//                                     <div className="w-full bg-slate-700 rounded-full h-2">
//                                     <div
//                                         className="bg-blue-500 h-2 rounded-full transition-all duration-500"
//                                         style={{ width: `${Math.min(item.completion_percentage, 100)}%` }}
//                                     />
//                                     </div>
//                                 </div>

//                                 {(item.display_quantity_produced || item.display_target_quantity) && (
//                                     <div>
//                                     <div className="flex justify-between items-center mb-1">
//                                         <span className="text-xs text-slate-400">Client View</span>
//                                         <span className="text-xs text-green-300">{item.display_completion_percentage}%</span>
//                                     </div>
//                                     <div className="w-full bg-slate-700 rounded-full h-2">
//                                         <div
//                                         className="bg-green-500 h-2 rounded-full transition-all duration-500"
//                                         style={{ width: `${Math.min(item.display_completion_percentage, 100)}%` }}
//                                         />
//                                     </div>
//                                     </div>
//                                 )}
//                                 </div>
//                             </div>
//                             )}
//                         </div>
//                     </div>
//                     ))}
//                 </div>

//                 {chartData.some(d => d.value > 0) && (
//                   <div>
//                     <h3 className="text-lg font-semibold text-white mb-4">Production Distribution</h3>
//                     <ResponsiveContainer width="100%" height={250}>
//                       <PieChart>
//                         <Pie
//                           data={chartData}
//                           cx="50%"
//                           cy="50%"
//                           labelLine={false}
//                           label={(entry) => entry.value > 0 ? `${entry.name}: ${entry.value}` : ''}
//                           outerRadius={80}
//                           fill="#8884d8"
//                           dataKey="value"
//                         >
//                           {chartData.map((entry, index) => (
//                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                           ))}
//                         </Pie>
//                         <Tooltip />
//                       </PieChart>
//                     </ResponsiveContainer>
//                   </div>
//                 )}
//               </>
//             )}
//           </div>

//           {/* Right Column */}
//           <div className="space-y-6">
//             {/* Today's Assignments */}
//             <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
//               <div className="flex justify-between items-center mb-4">
//                 <h2 className="text-2xl font-bold text-white flex items-center gap-2">
//                   <Users className="text-purple-400" size={24} />
//                   Today's Workers
//                 </h2>
//                 {canEdit && (
//                   <button
//                     onClick={() => setShowAssignModal(true)}
//                     className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-1"
//                   >
//                     <UserPlus size={16} />
//                     Assign
//                   </button>
//                 )}
//               </div>

//               {todayAssignments.length === 0 ? (
//                 <div className="text-center py-8">
//                   <p className="text-slate-400 mb-2">No workers assigned today</p>
//                   <p className="text-slate-500 text-sm">Assign present workers to this project</p>
//                 </div>
//               ) : (
//                 <div className="space-y-2">
//                   {todayAssignments.map((assignment) => (
//                     <div
//                       key={assignment.id}
//                       className="bg-slate-900 bg-opacity-50 rounded-lg p-3 hover:bg-opacity-70 transition-all"
//                     >
//                       <div className="flex justify-between items-start">
//                         <div className="flex-1">
//                           <div className="flex items-center gap-2">
//                             <p className="text-white font-medium">{assignment.worker_name}</p>
//                             {assignment.attendance_status && (
//                               <span className={`px-2 py-0.5 rounded text-xs font-medium ${
//                                 attendanceStatusColors[assignment.attendance_status]
//                               }`}>
//                                 {assignment.attendance_status}
//                               </span>
//                             )}
//                           </div>
//                           {assignment.worker_phone && (
//                             <p className="text-xs text-slate-400">{assignment.worker_phone}</p>
//                           )}
//                           {assignment.machine_name && (
//                             <div className="flex items-center gap-1 mt-1">
//                               <TrendingUp size={12} className="text-slate-500" />
//                               <p className="text-xs text-slate-400">{assignment.machine_name}</p>
//                             </div>
//                           )}
//                           {assignment.check_in_time && (
//                             <p className="text-xs text-slate-500">Check-in: {assignment.check_in_time.substring(0,5)}</p>
//                           )}
//                         </div>
//                         {canEdit && (
//                           <button
//                             onClick={() => handleRemoveAssignment(assignment.id)}
//                             className="p-1 hover:bg-red-600 hover:bg-opacity-20 text-red-400 rounded transition-colors"
//                           >
//                             <UserMinus size={16} />
//                           </button>
//                         )}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>

//             {/* Permanent Workers */}
//             <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="text-lg font-bold text-white">Permanent Team</h3>
//                 {canEdit && (
//                   <button
//                     onClick={() => setShowAddWorkerModal(true)}
//                     className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm flex items-center gap-1"
//                   >
//                     <Plus size={16} />
//                     Add
//                   </button>
//                 )}
//               </div>

//               {workers.length === 0 ? (
//                 <p className="text-slate-400 text-center py-4 text-sm">No permanent workers</p>
//               ) : (
//                 <div className="space-y-2">
//                   {workers.map((worker) => (
//                     <div
//                       key={worker.id}
//                       className="bg-slate-900 bg-opacity-50 rounded-lg p-3 flex justify-between items-center"
//                     >
//                       <div>
//                         <p className="text-white font-medium text-sm">{worker.name}</p>
//                         {worker.phone && (
//                           <p className="text-xs text-slate-400">{worker.phone}</p>
//                         )}
//                       </div>
//                       {canEdit && (
//                         <button
//                           onClick={() => handleRemovePermanentWorker(worker.id)}
//                           className="p-1 hover:bg-red-600 hover:bg-opacity-20 text-red-400 rounded"
//                         >
//                           <Trash2 size={14} />
//                         </button>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>

//             {/* Payments */}
//             <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="text-lg font-bold text-white flex items-center gap-2">
//                   <DollarSign className="text-green-400" size={20} />
//                   Payments
//                 </h3>
//                 {canEdit && (
//                   <button
//                     onClick={() => setShowAddPaymentModal(true)}
//                     className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-1"
//                   >
//                     <Plus size={16} />
//                     Add Payment
//                   </button>
//                 )}
//               </div>

//               {/* Payment Summary Cards */}
//               <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-slate-900 bg-opacity-50 rounded-lg">
//                 <div className="text-center">
//                   <p className="text-xs text-slate-400">Advance Paid</p>
//                   <p className="text-sm font-bold text-blue-400">{formatCurrency(payments.totals.advance_paid || 0)}</p>
//                 </div>
//                 <div className="text-center">
//                   <p className="text-xs text-slate-400">Pending</p>
//                   <p className="text-sm font-bold text-orange-400">{formatCurrency(payments.totals.pending_amount || 0)}</p>
//                 </div>
//                 <div className="text-center">
//                   <p className="text-xs text-slate-400">Total Paid</p>
//                   <p className="text-sm font-bold text-green-400">{formatCurrency(payments.totals.total_paid || 0)}</p>
//                 </div>
//               </div>

//               {/* Total Project Value */}
//               {payments.totals.total_project_value > 0 && (
//                 <div className="mb-4 p-3 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
//                   <div className="flex justify-between items-center">
//                     <span className="text-slate-300 text-sm">Total Project Value:</span>
//                     <span className="text-white font-bold">{formatCurrency(payments.totals.total_project_value || 0)}</span>
//                   </div>
//                 </div>
//               )}

//               {payments.payments && payments.payments.length > 0 ? (
//                 <div className="space-y-2 max-h-64 overflow-y-auto">
//                   {payments.payments.map((payment) => (
//                     <div
//                       key={payment.id}
//                       className="bg-slate-900 bg-opacity-50 rounded-lg p-3 flex justify-between items-start"
//                     >
//                       <div className="flex-1">
//                         <div className="flex justify-between items-start mb-1">
//                           <p className="text-white font-medium">{formatCurrency(payment.amount)}</p>
//                           <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
//                             payment.payment_type === 'advance' ? 'bg-blue-500 bg-opacity-20 text-blue-300' :
//                             payment.payment_type === 'partial' ? 'bg-purple-500 bg-opacity-20 text-purple-300' :
//                             'bg-green-500 bg-opacity-20 text-green-300'
//                           }`}>
//                             {payment.payment_type}
//                           </span>
//                         </div>
//                         <p className="text-xs text-slate-400">{payment.payment_method} • {formatDate(payment.payment_date)}</p>
//                         {payment.transaction_reference && (
//                           <p className="text-xs text-slate-500">Ref: {payment.transaction_reference}</p>
//                         )}
//                         {payment.notes && (
//                           <p className="text-xs text-slate-400 mt-1">{payment.notes}</p>
//                         )}
//                       </div>
//                       {user?.role === 'owner' && (
//                         <button
//                           onClick={() => handleDeletePayment(payment.id)}
//                           className="p-1 hover:bg-red-600 hover:bg-opacity-20 text-red-400 rounded ml-2"
//                         >
//                           <Trash2 size={14} />
//                         </button>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <p className="text-slate-400 text-center py-4 text-sm">No payments recorded</p>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Timeline */}
//         {timeline && timeline.length > 0 && (
//           <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 mt-8">
//             <div className="flex items-center gap-2 mb-6">
//               <Clock className="text-blue-400" size={24} />
//               <h2 className="text-2xl font-bold text-white">Project Timeline</h2>
//             </div>

//             <div className="space-y-4">
//               {timeline.map((entry, index) => (
//                 <div key={entry.id} className="relative">
//                   {index < timeline.length - 1 && (
//                     <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-slate-700" />
//                   )}
//                   <div className="flex gap-4">
//                     <div className="flex-shrink-0 w-8 h-8 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center border-2 border-blue-500">
//                       <CheckCircle size={16} className="text-blue-400" />
//                     </div>
//                     <div className="flex-1 pb-6">
//                       <p className="text-white font-medium capitalize">{entry.status.replace('-', ' ')}</p>
//                       {entry.notes && (
//                         <p className="text-slate-400 text-sm mt-1">{entry.notes}</p>
//                       )}
//                       <p className="text-slate-500 text-xs mt-2">
//                         {new Date(entry.created_at).toLocaleDateString('en-US', {
//                           month: 'short',
//                           day: 'numeric',
//                           year: 'numeric',
//                           hour: '2-digit',
//                           minute: '2-digit'
//                         })}
//                         {entry.changed_by_name && ` by ${entry.changed_by_name}`}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}
//       </main>

//       {/* Add Product Modal */}
//       {showAddProductModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-2xl font-bold text-white">Add Product</h2>
//               <button onClick={() => setShowAddProductModal(false)} className="text-slate-400 hover:text-white">
//                 <X size={24} />
//               </button>
//             </div>

//             {availableProducts.length === 0 ? (
//               <p className="text-slate-400 text-center py-4">All products already added</p>
//             ) : (
//               <>
//                 <div className="space-y-4 mb-4">
//                   <div>
//                     <label className="block text-slate-300 mb-2 text-sm">Product *</label>
//                     <select
//                       value={productForm.product_id}
//                       onChange={(e) => setProductForm({...productForm, product_id: e.target.value})}
//                       className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
//                     >
//                       <option value="">Select product...</option>
//                       {availableProducts.map((product) => (
//                         <option key={product.id} value={product.id}>
//                           {product.name} ({product.type})
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-slate-300 mb-2 text-sm">Target Quantity *</label>
//                     <input
//                       type="number"
//                       value={productForm.target_quantity}
//                       onChange={(e) => setProductForm({...productForm, target_quantity: e.target.value})}
//                       className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
//                       placeholder="e.g., 1000"
//                     />
//                   </div>
//                 </div>

//                 <div className="flex gap-3">
//                   <button
//                     onClick={handleAddProduct}
//                     disabled={!productForm.product_id || !productForm.target_quantity}
//                     className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg"
//                   >
//                     Add Product
//                   </button>
//                   <button
//                     onClick={() => setShowAddProductModal(false)}
//                     className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               </>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Add Permanent Worker Modal */}
//       {showAddWorkerModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-2xl font-bold text-white">Add Permanent Worker</h2>
//               <button onClick={() => setShowAddWorkerModal(false)} className="text-slate-400 hover:text-white">
//                 <X size={24} />
//               </button>
//             </div>

//             {availablePermanentWorkers.length === 0 ? (
//               <p className="text-slate-400 text-center py-4">All workers already assigned</p>
//             ) : (
//               <>
//                 <div className="mb-4">
//                   <label className="block text-slate-300 mb-2 text-sm">Select Worker *</label>
//                   <select
//                     value={selectedWorkerId}
//                     onChange={(e) => setSelectedWorkerId(e.target.value)}
//                     className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
//                   >
//                     <option value="">Choose a worker...</option>
//                     {availablePermanentWorkers.map((worker) => (
//                       <option key={worker.id} value={worker.id}>
//                         {worker.name} {worker.phone && `- ${worker.phone}`}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <div className="flex gap-3">
//                   <button
//                     onClick={handleAddPermanentWorker}
//                     disabled={!selectedWorkerId}
//                     className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white rounded-lg"
//                   >
//                     Add Worker
//                   </button>
//                   <button
//                     onClick={() => setShowAddWorkerModal(false)}
//                     className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               </>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Assign Daily Worker Modal */}
//       {showAssignModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-2xl font-bold text-white">Assign Worker (Today)</h2>
//               <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-white">
//                 <X size={24} />
//               </button>
//             </div>

//             {unassignedAvailableWorkers.length === 0 ? (
//               <div className="text-center py-6">
//                 <p className="text-slate-400 mb-2">No available workers</p>
//                 <p className="text-slate-500 text-sm">All present workers are assigned or no workers marked present today.</p>
//               </div>
//             ) : (
//               <>
//                 <div className="space-y-4 mb-4">
//                   <div>
//                     <label className="block text-slate-300 mb-2 text-sm">Worker *</label>
//                     <select
//                       value={assignmentForm.worker_id}
//                       onChange={(e) => setAssignmentForm({...assignmentForm, worker_id: e.target.value})}
//                       className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
//                     >
//                       <option value="">Select worker...</option>
//                       {unassignedAvailableWorkers.map((worker) => (
//                         <option key={worker.id} value={worker.id}>
//                           {worker.name} {worker.phone && `- ${worker.phone}`} ({worker.status})
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-slate-300 mb-2 text-sm">Machine</label>
//                     <select
//                       value={assignmentForm.machine_id}
//                       onChange={(e) => setAssignmentForm({...assignmentForm, machine_id: e.target.value})}
//                       className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
//                     >
//                       <option value="">Select machine (optional)...</option>
//                       {allMachines.map((machine) => (
//                         <option key={machine.id} value={machine.id}>
//                           {machine.name} - {machine.type}
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-slate-300 mb-2 text-sm">Notes</label>
//                     <textarea
//                       value={assignmentForm.notes}
//                       onChange={(e) => setAssignmentForm({...assignmentForm, notes: e.target.value})}
//                       placeholder="Additional notes..."
//                       rows="2"
//                       className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
//                     />
//                   </div>
//                 </div>

//                 <div className="flex gap-3">
//                   <button
//                     onClick={handleAssignWorker}
//                     disabled={!assignmentForm.worker_id}
//                     className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg"
//                   >
//                     Assign Worker
//                   </button>
//                   <button
//                     onClick={() => setShowAssignModal(false)}
//                     className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               </>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Set Client Password Modal */}
//       {showPasswordModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-2xl font-bold text-white">Set Client Password</h2>
//               <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-white">
//                 <X size={24} />
//               </button>
//             </div>

//             <div className="mb-4">
//               <label className="block text-slate-300 mb-2 text-sm">Password (min 6 characters) *</label>
//               <input
//                 type="text"
//                 value={clientPassword}
//                 onChange={(e) => setClientPassword(e.target.value)}
//                 className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
//                 placeholder="Enter password for client"
//               />
//               <p className="text-slate-500 text-xs mt-2">
//                 Share this password with client along with Project ID: {project.id}
//               </p>
//             </div>

//             <div className="flex gap-3">
//               <button
//                 onClick={handleSetClientPassword}
//                 disabled={clientPassword.length < 6}
//                 className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg"
//               >
//                 Set Password
//               </button>
//               <button
//                 onClick={() => setShowPasswordModal(false)}
//                 className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Add Payment Modal */}
//       {showAddPaymentModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-2xl font-bold text-white">Add Payment</h2>
//               <button onClick={() => setShowAddPaymentModal(false)} className="text-slate-400 hover:text-white">
//                 <X size={24} />
//               </button>
//             </div>

//             <div className="space-y-4 mb-4">
//               <div>
//                 <label className="block text-slate-300 mb-2 text-sm">Amount *</label>
//                 <input
//                   type="number"
//                   value={paymentForm.amount}
//                   onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
//                   className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
//                   placeholder="e.g., 500000"
//                 />
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-slate-300 mb-2 text-sm">Type *</label>
//                   <select
//                     value={paymentForm.payment_type}
//                     onChange={(e) => setPaymentForm({...paymentForm, payment_type: e.target.value})}
//                     className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
//                   >
//                     <option value="advance">Advance</option>
//                     <option value="partial">Partial</option>
//                     <option value="final">Final</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-slate-300 mb-2 text-sm">Method</label>
//                   <select
//                     value={paymentForm.payment_method}
//                     onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})}
//                     className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
//                   >
//                     <option value="Bank Transfer">Bank Transfer</option>
//                     <option value="Cheque">Cheque</option>
//                     <option value="Cash">Cash</option>
//                     <option value="UPI">UPI</option>
//                   </select>
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-slate-300 mb-2 text-sm">Date *</label>
//                 <input
//                   type="date"
//                   value={paymentForm.payment_date}
//                   onChange={(e) => setPaymentForm({...paymentForm, payment_date: e.target.value})}
//                   className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
//                 />
//               </div>

//               <div>
//                 <label className="block text-slate-300 mb-2 text-sm">Transaction Reference</label>
//                 <input
//                   type="text"
//                   value={paymentForm.transaction_reference}
//                   onChange={(e) => setPaymentForm({...paymentForm, transaction_reference: e.target.value})}
//                   className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
//                   placeholder="e.g., TXN123456"
//                 />
//               </div>

//               <div>
//                 <label className="block text-slate-300 mb-2 text-sm">Notes</label>
//                 <textarea
//                   value={paymentForm.notes}
//                   onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
//                   rows="2"
//                   className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
//                   placeholder="Additional notes..."
//                 />
//               </div>
//             </div>

//             <div className="flex gap-3">
//               <button
//                 onClick={handleAddPayment}
//                 disabled={!paymentForm.amount}
//                 className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg"
//               >
//                 Add Payment
//               </button>
//               <button
//                 onClick={() => setShowAddPaymentModal(false)}
//                 className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Edit Project Modal */}
// {showEditModal && (
//   <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
//     <div className="bg-slate-800 rounded-xl p-6 max-w-2xl w-full my-8">
//       <div className="flex justify-between items-center mb-4">
//         <h2 className="text-2xl font-bold text-white">Edit Project</h2>
//         <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">
//           <X size={24} />
//         </button>
//       </div>

//       <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
//         <div>
//           <label className="block text-slate-300 mb-2 text-sm">Project Name *</label>
//           <input
//             type="text"
//             value={editProjectForm.name}
//             onChange={(e) => setEditProjectForm({...editProjectForm, name: e.target.value})}
//             className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
//           />
//         </div>

//         <div>
//           <label className="block text-slate-300 mb-2 text-sm">Description</label>
//           <textarea
//             value={editProjectForm.description}
//             onChange={(e) => setEditProjectForm({...editProjectForm, description: e.target.value})}
//             rows="3"
//             className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
//           />
//         </div>

//         {/* Add Project Value Field */}
//         <div>
//           <label className="block text-slate-300 mb-2 text-sm">Project Value (₹)</label>
//           <input
//             type="number"
//             value={editProjectForm.project_value}
//             onChange={(e) => setEditProjectForm({...editProjectForm, project_value: e.target.value})}
//             className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
//             placeholder="Enter total project value"
//           />
//         </div>

//         <div>
//           <label className="block text-slate-300 mb-2 text-sm">Status *</label>
//           <select
//             value={editProjectForm.status}
//             onChange={(e) => setEditProjectForm({...editProjectForm, status: e.target.value})}
//             className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
//           >
//             <option value="pitching">Pitching</option>
//             <option value="received">Received</option>
//             <option value="started">Started</option>
//             <option value="on-hold">On Hold</option>
//             <option value="finished-production">Finished Production</option>
//             <option value="payment-pending">Payment Pending</option>
//             <option value="closed">Closed</option>
//           </select>
//         </div>

//         <div className="grid grid-cols-2 gap-4">
//           <div>
//             <label className="block text-slate-300 mb-2 text-sm">Expected Delivery</label>
//             <input
//               type="date"
//               value={editProjectForm.expected_delivery_date}
//               onChange={(e) => setEditProjectForm({...editProjectForm, expected_delivery_date: e.target.value})}
//               className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
//             />
//           </div>

//           <div>
//             <label className="block text-slate-300 mb-2 text-sm">Actual Delivery</label>
//             <input
//               type="date"
//               value={editProjectForm.actual_delivery_date}
//               onChange={(e) => setEditProjectForm({...editProjectForm, actual_delivery_date: e.target.value})}
//               className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
//             />
//           </div>
//         </div>

//         <div>
//           <label className="block text-slate-300 mb-2 text-sm">Client Name</label>
//           <input
//             type="text"
//             value={editProjectForm.client_name}
//             onChange={(e) => setEditProjectForm({...editProjectForm, client_name: e.target.value})}
//             className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
//           />
//         </div>

//         <div className="grid grid-cols-2 gap-4">
//           <div>
//             <label className="block text-slate-300 mb-2 text-sm">Client Email</label>
//             <input
//               type="email"
//               value={editProjectForm.client_email}
//               onChange={(e) => setEditProjectForm({...editProjectForm, client_email: e.target.value})}
//               className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
//             />
//           </div>

//           <div>
//             <label className="block text-slate-300 mb-2 text-sm">Client Phone</label>
//             <input
//               type="tel"
//               value={editProjectForm.client_phone}
//               onChange={(e) => setEditProjectForm({...editProjectForm, client_phone: e.target.value})}
//               className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
//             />
//           </div>
//         </div>
//       </div>

//       <div className="flex gap-3">
//         <button
//           onClick={handleUpdateProject}
//           className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
//         >
//           Update Project
//         </button>
//         <button
//           onClick={() => setShowEditModal(false)}
//           className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
//         >
//           Cancel
//         </button>
//       </div>
//     </div>
//   </div>
// )}

//       {/* Display Configuration Modal */}
//     {showDisplayModal && selectedProduction && (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//         <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full">
//         <div className="flex justify-between items-center mb-4">
//             <h2 className="text-2xl font-bold text-white">Configure Client Display</h2>
//             <button onClick={() => setShowDisplayModal(false)} className="text-slate-400 hover:text-white">
//             <X size={24} />
//             </button>
//         </div>

//         <div className="mb-4">
//             <p className="text-slate-300 mb-2">Product: <span className="font-semibold">{selectedProduction.product_name}</span></p>
//             <p className="text-slate-400 text-sm mb-4">Set different values to show to the client. Leave empty to use actual values.</p>
            
//             <div className="space-y-4">
//             <div>
//                 <label className="block text-slate-300 mb-2 text-sm">Display Quantity</label>
//                 <input
//                 type="number"
//                 value={displayForm.displayQuantity}
//                 onChange={(e) => setDisplayForm({...displayForm, displayQuantity: e.target.value})}
//                 placeholder={selectedProduction.quantity_produced}
//                 className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-green-500"
//                 />
//                 <p className="text-slate-500 text-xs mt-1">
//                 Actual: {selectedProduction.quantity_produced}
//                 </p>
//             </div>

//             <div>
//                 <label className="block text-slate-300 mb-2 text-sm">Display Target</label>
//                 <input
//                 type="number"
//                 value={displayForm.displayTarget}
//                 onChange={(e) => setDisplayForm({...displayForm, displayTarget: e.target.value})}
//                 placeholder={selectedProduction.target_quantity}
//                 className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-green-500"
//                 />
//                 <p className="text-slate-500 text-xs mt-1">
//                 Actual: {selectedProduction.target_quantity}
//                 </p>
//             </div>
//             </div>

//             {displayForm.displayQuantity && displayForm.displayTarget && (
//             <div className="mt-4 p-3 bg-slate-900 rounded-lg">
//                 <p className="text-slate-300 text-sm">Client will see:</p>
//                 <p className="text-green-300 font-semibold">
//                 {displayForm.displayQuantity} / {displayForm.displayTarget} {selectedProduction.product_unit}
//                 </p>
//                 <p className="text-slate-400 text-xs">
//                 Progress: {Math.round((displayForm.displayQuantity / displayForm.displayTarget) * 100)}%
//                 </p>
//             </div>
//             )}
//         </div>

//         <div className="flex gap-3">
//             <button
//             onClick={handleUpdateDisplayValues}
//             className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
//             >
//             Save Display Settings
//             </button>
//             <button
//             onClick={() => {
//                 setShowDisplayModal(false);
//                 setSelectedProduction(null);
//                 setDisplayForm({ displayQuantity: '', displayTarget: '' });
//             }}
//             className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
//             >
//             Cancel
//             </button>
//         </div>

//         {(selectedProduction.display_quantity_produced || selectedProduction.display_target_quantity) && (
//             <div className="mt-4 pt-4 border-t border-slate-700">
//             <button
//                 onClick={async () => {
//                 try {
//                     await axios.put(
//                     `${API_URL}/products/production/${selectedProduction.id}/display`,
//                     {
//                         display_quantity_produced: null,
//                         display_target_quantity: null
//                     },
//                     { headers: getAuthHeader() }
//                     );
//                     setShowDisplayModal(false);
//                     setSelectedProduction(null);
//                     setDisplayForm({ displayQuantity: '', displayTarget: '' });
//                     fetchProjectDetails();
//                 } catch (error) {
//                     alert('Failed to reset display values');
//                 }
//                 }}
//                 className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
//             >
//                 Reset to Actual Values
//             </button>
//             </div>
//         )}
//         </div>
//     </div>
//     )}
//     </div>
//   );
// };

// export default ProjectDetails;