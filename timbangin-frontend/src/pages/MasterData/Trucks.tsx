import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../api/axiosInstance';
import DataTable from '../../components/UI/DataTable';
import Pagination from '../../components/UI/Pagination';
import ConfirmDialog from '../../components/UI/ConfirmDialog';
import PermissionGate from '../../components/Guard/PermissionGate';
import Modal from '../../components/UI/Modal';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { StatusBadge } from '../../components/UI/StatusBadge';

interface Truck {
  id: string;
  plateNumber: string;
  driverName: string;
  customerId: string;
  customerName: string;
  maxCapacityKg: number;
  isActive: boolean;
}

interface CustomerLookup {
  id: string;
  name: string;
}

export const Trucks = () => {
  const [data, setData] = useState<Truck[]>([]);
  const [customers, setCustomers] = useState<CustomerLookup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: '', title: '' });
  const [modalState, setModalState] = useState({ isOpen: false, isEdit: false, id: '' });
  const [formData, setFormData] = useState({ plateNumber: '', driverName: '', customerId: '', maxCapacityKg: 0, isActive: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/customers', { params: { PageSize: 100 } });
      if (response.data.success) {
        setCustomers(response.data.data.items);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/trucks', {
        params: {
          SearchTerm: searchTerm,
          PageNumber: page,
          PageSize: pageSize
        }
      });
      if (response.data.success) {
        setData(response.data.data.items);
        setTotalPages(response.data.data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching trucks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, page, pageSize]);

  useEffect(() => {
    fetchData();
    fetchCustomers();
  }, [fetchData, fetchCustomers]);

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/trucks/${deleteDialog.id}`);
      setDeleteDialog({ isOpen: false, id: '', title: '' });
      fetchData();
    } catch (error) {
      console.error('Error deleting truck:', error);
    }
  };

  const handleOpenAdd = () => {
    setFormData({ plateNumber: '', driverName: '', customerId: '', maxCapacityKg: 0, isActive: true });
    setModalState({ isOpen: true, isEdit: false, id: '' });
  };

  const handleOpenEdit = (row: Truck) => {
    setFormData({ 
      plateNumber: row.plateNumber, 
      driverName: row.driverName, 
      customerId: row.customerId, 
      maxCapacityKg: row.maxCapacityKg, 
      isActive: row.isActive 
    });
    setModalState({ isOpen: true, isEdit: true, id: row.id });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (modalState.isEdit) {
        await axiosInstance.put(`/trucks/${modalState.id}`, formData);
      } else {
        await axiosInstance.post('/trucks', { 
          plateNumber: formData.plateNumber, 
          driverName: formData.driverName, 
          customerId: formData.customerId, 
          maxCapacityKg: formData.maxCapacityKg 
        });
      }
      setModalState({ isOpen: false, isEdit: false, id: '' });
      fetchData();
    } catch (error: any) {
      console.error('Error saving truck:', error);
      let errorMessage = 'Terjadi kesalahan saat menyimpan truck.';
      if (error.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.errors) {
          const errors = error.response.data.errors;
          if (Array.isArray(errors)) {
            errorMessage = errors.join('\n');
          } else if (typeof errors === 'object') {
            errorMessage = Object.values(errors).flat().join('\n');
          }
        }
      }
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { 
      header: 'No. Polisi', 
      accessor: (row: Truck) => <span className="font-mono text-base">{row.plateNumber}</span> 
    },
    { header: 'Sopir', accessor: 'driverName' as keyof Truck },
    { header: 'Perusahaan / Customer', accessor: 'customerName' as keyof Truck },
    { 
      header: 'Kapasitas Maksimal (kg)', 
      className: 'text-right',
      accessor: (row: Truck) => <span className="font-mono block text-right">{row.maxCapacityKg.toLocaleString('id-ID')}</span> 
    },
    {
      header: 'Status',
      accessor: (row: Truck) => (
        <StatusBadge 
          status={row.isActive ? 'ready' : 'error'} 
          label={row.isActive ? 'Aktif' : 'Nonaktif'} 
        />
      ),
    },
    {
      header: 'Aksi',
      accessor: (row: Truck) => (
        <div className="flex space-x-3">
          <PermissionGate permission="truck.update">
            <button className="text-gray-500 hover:text-safety-amber dark:text-gray-400 dark:hover:text-safety-amber transition-colors" title="Edit" onClick={() => handleOpenEdit(row)}>
              <Edit2 size={18} />
            </button>
          </PermissionGate>
          <PermissionGate permission="truck.delete">
            <button 
              className="text-gray-500 hover:text-alert-red dark:text-gray-400 dark:hover:text-alert-red transition-colors" 
              title="Delete"
              onClick={() => setDeleteDialog({ isOpen: true, id: row.id, title: row.plateNumber })}
            >
              <Trash2 size={18} />
            </button>
          </PermissionGate>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-steel-100">Master Truck</h1>
        <PermissionGate permission="truck.create">
          <button onClick={handleOpenAdd} className="flex items-center space-x-2 bg-safety-amber text-steel-900 px-4 py-2 rounded-md hover:bg-yellow-500 transition-colors font-display tracking-wide uppercase text-sm font-semibold">
            <Plus size={20} />
            <span>Tambah Truck</span>
          </button>
        </PermissionGate>
      </div>

      <div className="flex justify-between items-center bg-white dark:bg-steel-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-steel-900">
        <div className="relative w-72">
          <input
            type="text"
            placeholder="Cari truck..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-steel-900 bg-gray-50 dark:bg-steel-900 text-gray-900 dark:text-steel-100 rounded-md focus:ring-safety-amber focus:border-safety-amber transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(1);
                fetchData();
              }
            }}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>
      </div>

      <DataTable data={data} columns={columns} isLoading={isLoading} />
      
      {!isLoading && data.length > 0 && (
        <Pagination 
          currentPage={page} 
          totalPages={totalPages} 
          onPageChange={setPage} 
        />
      )}

      <Modal 
        isOpen={modalState.isOpen} 
        onClose={() => setModalState({ ...modalState, isOpen: false })} 
        title={modalState.isEdit ? "Edit Truck" : "Tambah Truck"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-steel-100">Plat Nomor (No. Polisi)</label>
            <input 
              type="text" 
              required
              placeholder="Contoh: R 3905 DW atau R3905DW"
              className="bg-gray-50 dark:bg-steel-900 border border-gray-300 dark:border-steel-800 text-gray-900 dark:text-steel-100 text-sm font-mono uppercase rounded-lg focus:ring-safety-amber focus:border-safety-amber block w-full p-2.5" 
              value={formData.plateNumber}
              onChange={(e) => setFormData({...formData, plateNumber: e.target.value.toUpperCase()})}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Bisa diinput dengan atau tanpa spasi (misal: R 3905 DW atau R3905DW)</p>
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-steel-100">Nama Sopir</label>
            <input 
              type="text" 
              required
              className="bg-gray-50 dark:bg-steel-900 border border-gray-300 dark:border-steel-800 text-gray-900 dark:text-steel-100 text-sm rounded-lg focus:ring-safety-amber focus:border-safety-amber block w-full p-2.5" 
              value={formData.driverName}
              onChange={(e) => setFormData({...formData, driverName: e.target.value})}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-steel-100">Customer (Pemilik)</label>
            <select 
              required
              className="bg-gray-50 dark:bg-steel-900 border border-gray-300 dark:border-steel-800 text-gray-900 dark:text-steel-100 text-sm rounded-lg focus:ring-safety-amber focus:border-safety-amber block w-full p-2.5"
              value={formData.customerId}
              onChange={(e) => setFormData({...formData, customerId: e.target.value})}
            >
              <option value="">-- Pilih Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-steel-100">Kapasitas Maksimal (kg)</label>
            <input 
              type="number" 
              required
              min="0"
              className="bg-gray-50 dark:bg-steel-900 border border-gray-300 dark:border-steel-800 text-gray-900 dark:text-steel-100 font-mono text-sm rounded-lg focus:ring-safety-amber focus:border-safety-amber block w-full p-2.5" 
              value={formData.maxCapacityKg}
              onChange={(e) => setFormData({...formData, maxCapacityKg: Number(e.target.value)})}
            />
          </div>
          {modalState.isEdit && (
            <div className="flex items-center">
              <input 
                id="isActiveTruck" 
                type="checkbox" 
                className="w-4 h-4 text-safety-amber bg-gray-100 dark:bg-steel-900 border-gray-300 dark:border-steel-800 rounded focus:ring-safety-amber"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              />
              <label htmlFor="isActiveTruck" className="ms-2 text-sm font-medium text-gray-900 dark:text-steel-100">Aktif</label>
            </div>
          )}
          <div className="flex justify-end pt-4 space-x-2">
            <button 
              type="button" 
              className="font-display tracking-wide uppercase text-sm font-semibold py-2.5 px-5 text-gray-900 dark:text-steel-100 bg-white dark:bg-steel-800 rounded-lg border border-gray-200 dark:border-steel-900 hover:bg-gray-100 dark:hover:bg-steel-900"
              onClick={() => setModalState({ ...modalState, isOpen: false })}
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="font-display tracking-wide uppercase text-sm font-semibold text-steel-900 bg-safety-amber hover:bg-yellow-500 rounded-lg px-5 py-2.5 focus:outline-none disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Hapus Truck"
        message={`Apakah Anda yakin ingin menghapus truck "${deleteDialog.title}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, id: '', title: '' })}
      />
    </div>
  );
};
