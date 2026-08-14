import { api } from './api';
import type { ImportReport, AuditLogEntry } from '../types';

export function previewImport(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return api
    .post<{ dryRun: true; report: ImportReport }>('/import/excel/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
}

export function confirmImport(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return api
    .post<{ dryRun: false; report: ImportReport }>('/import/excel/confirm', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
}

export function getAuditLogs() {
  return api.get<AuditLogEntry[]>('/audit-logs').then((r) => r.data);
}
