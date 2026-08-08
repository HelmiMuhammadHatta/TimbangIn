import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onCancel}></div>
        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
        <div className="inline-block transform overflow-hidden rounded-lg bg-white dark:bg-steel-800 border border-gray-200 dark:border-steel-900 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
          <div className="bg-white dark:bg-steel-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-alert-red/20 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle className="h-6 w-6 text-alert-red" aria-hidden="true" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg font-display font-bold uppercase tracking-wide leading-6 text-gray-900 dark:text-steel-100">{title}</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-steel-900 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-alert-red px-4 py-2 text-sm font-display tracking-wide uppercase font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto"
              onClick={onConfirm}
            >
              Hapus
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 dark:border-steel-700 bg-white dark:bg-steel-800 px-4 py-2 text-sm font-display tracking-wide uppercase font-semibold text-gray-700 dark:text-steel-100 shadow-sm hover:bg-gray-50 dark:hover:bg-steel-700 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto"
              onClick={onCancel}
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
