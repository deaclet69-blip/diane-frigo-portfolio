import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  Alert,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  LinearProgress,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { previewImport, confirmImport } from '../../services/admin';
import type { ImportReport } from '../../types';
import { diane } from '../../theme';

export default function ImportExcelPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportReport | null>(null);
  const [finalReport, setFinalReport] = useState<ImportReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(f: File | null) {
    setFile(f);
    setPreview(null);
    setFinalReport(null);
    setError(null);
    if (!f) return;
    setLoading(true);
    try {
      const { report } = await previewImport(f);
      setPreview(report);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not analyze this file.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!file) return;
    setLoading(true);
    try {
      const { report } = await confirmImport(file);
      setFinalReport(report);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Import failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box maxWidth={720}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Import your "Cold Storage Stock Management" Excel file (the "Stock" sheet). Nothing is written until you confirm
        the preview — and existing data is never deleted.
      </Typography>

      <Paper sx={{ p: 3, mb: 3, textAlign: 'center', border: '2px dashed #ccc' }}>
        <Button component="label" variant="outlined" startIcon={<UploadFileIcon />}>
          Choose a .xlsx file
          <input
            type="file"
            accept=".xlsx,.xls"
            hidden
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />
        </Button>
        {file && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            {file.name}
          </Typography>
        )}
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {preview && !finalReport && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            Preview Before Import
          </Typography>
          <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Rows Read
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {preview.totalRows}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Stock Entries
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: diane.green }}>
                {preview.stockEntriesFound}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Invoices Detected
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: diane.blue }}>
                {preview.invoicesFound}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Duplicates Skipped
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: diane.orange }}>
                {preview.duplicates.length}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Errors
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: diane.red }}>
                {preview.errors.length}
              </Typography>
            </Box>
          </Stack>

          {(preview.newProducts?.length ?? 0) > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>{preview.newProducts?.length ?? 0} new product(s)</strong> will be created automatically (using
              the price found at their first appearance in the file): {(preview.newProducts ?? []).join(', ')}. You can
              adjust their price or category afterward in Settings &gt; Products.
            </Alert>
          )}

          {(preview.errors.length > 0 || preview.duplicates.length > 0) && (
            <TableContainer>
              <Table size="small" sx={{ mb: 2 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Row</TableCell>
                    <TableCell>Issue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[...preview.errors, ...preview.duplicates].slice(0, 30).map((e, i) => (
                    <TableRow key={i}>
                      <TableCell>{e.rowNumber}</TableCell>
                      <TableCell>{e.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Button variant="contained" onClick={handleConfirm} disabled={loading}>
            Confirm Import
          </Button>
        </Paper>
      )}

      {finalReport && (
        <Alert severity="success">
          <Typography fontWeight={700}>Import Complete</Typography>
          <Typography variant="body2">
            {finalReport.importedInvoices} invoice(s) and {finalReport.importedEntries} stock entry(ies) imported.
            {finalReport.duplicates.length > 0 && ` ${finalReport.duplicates.length} duplicate(s) skipped.`}
            {finalReport.errors.length > 0 && ` ${finalReport.errors.length} row(s) had errors.`}
          </Typography>
        </Alert>
      )}
    </Box>
  );
}
