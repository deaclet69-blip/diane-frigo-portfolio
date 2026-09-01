import { useState } from 'react';
import {
  Box, Typography, Paper, Button, Stack, Alert, Table, TableContainer, TableHead, TableRow, TableCell,
  TableBody, Chip, LinearProgress,
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
      setError(err?.response?.data?.message ?? "Impossible d'analyser ce fichier.");
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
      setError(err?.response?.data?.message ?? "Échec de l'import.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box maxWidth={720}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Importe ton fichier Excel "Gestion Stock Chambre Froide" (feuille "Stock"). Rien n'est
        écrit tant que tu n'as pas confirmé l'aperçu — et les données déjà présentes ne sont
        jamais supprimées (§21 du cahier des charges).
      </Typography>

      <Paper sx={{ p: 3, mb: 3, textAlign: 'center', border: '2px dashed #ccc' }}>
        <Button component="label" variant="outlined" startIcon={<UploadFileIcon />}>
          Choisir un fichier .xlsx
          <input
            type="file"
            accept=".xlsx,.xls"
            hidden
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />
        </Button>
        {file && <Typography variant="body2" sx={{ mt: 1 }}>{file.name}</Typography>}
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {preview && !finalReport && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Aperçu avant import</Typography>
          <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Lignes lues</Typography>
              <Typography variant="h6" fontWeight={700}>{preview.totalRows}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Entrées de stock</Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: diane.green }}>{preview.stockEntriesFound}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Factures détectées</Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: diane.blue }}>{preview.invoicesFound}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Doublons ignorés</Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: diane.orange }}>{preview.duplicates.length}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Erreurs</Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: diane.red }}>{preview.errors.length}</Typography>
            </Box>
          </Stack>

          {(preview.newProducts?.length ?? 0) > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>{preview.newProducts?.length ?? 0} nouveau(x) produit(s)</strong> seront créés automatiquement
              (avec le prix trouvé à leur première apparition dans le fichier) : {(preview.newProducts ?? []).join(', ')}.
              Tu pourras ajuster leurs prix ou leur catégorie ensuite dans Paramètres &gt; Produits.
            </Alert>
          )}

          {(preview.errors.length > 0 || preview.duplicates.length > 0) && (
            <TableContainer>
<Table size="small" sx={{ mb: 2 }}>
              <TableHead>
                <TableRow><TableCell>Ligne</TableCell><TableCell>Problème</TableCell></TableRow>
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
            Confirmer l'import
          </Button>
        </Paper>
      )}

      {finalReport && (
        <Alert severity="success">
          <Typography fontWeight={700}>Import terminé</Typography>
          <Typography variant="body2">
            {finalReport.importedInvoices} facture(s) et {finalReport.importedEntries} entrée(s) de stock importées.
            {finalReport.duplicates.length > 0 && ` ${finalReport.duplicates.length} doublon(s) ignoré(s).`}
            {finalReport.errors.length > 0 && ` ${finalReport.errors.length} ligne(s) en erreur.`}
          </Typography>
        </Alert>
      )}
    </Box>
  );
}
