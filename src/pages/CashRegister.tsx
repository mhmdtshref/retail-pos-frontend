import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  AccountBalance,
  Add,
  Remove,
  Lock,
  LockOpen,
  AttachMoney,
  History,
} from '@mui/icons-material';
import { useCashRegisterApi, CashRegisterStatus, CashMovement } from '../services/cashRegister.service';

const CashRegister: React.FC = () => {
  const [status, setStatus] = useState<CashRegisterStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<'open' | 'close' | 'deposit' | 'withdraw' | null>(null);
  const [dialogData, setDialogData] = useState({
    openingAmount: '',
    actualAmount: '',
    depositAmount: '',
    withdrawAmount: '',
    notes: '',
  });
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [showMovements, setShowMovements] = useState(false);

  const cashRegisterApi = useCashRegisterApi();

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const statusData = await cashRegisterApi.getStatus();
      console.log('Cash Register Status Response:', statusData);
      setStatus(statusData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch cash register status');
      console.error('Error fetching status:', err);
    } finally {
      setLoading(false);
    }
  }, [cashRegisterApi]);

  const fetchMovements = useCallback(async () => {
    try {
      const history = await cashRegisterApi.getHistory();
      if (history.cashRegisters.length > 0) {
        const currentRegister = history.cashRegisters[0];
        setMovements(currentRegister.movements || []);
      }
    } catch (err) {
      console.error('Error fetching movements:', err);
    }
  }, [cashRegisterApi]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (status?.isOpen) {
      fetchMovements();
    }
  }, [status?.isOpen, fetchMovements]);

  const handleOpenRegister = async () => {
    try {
      setLoading(true);
      await cashRegisterApi.open({
        openingAmount: parseFloat(dialogData.openingAmount) || 0,
        notes: dialogData.notes,
      });
      setOpenDialog(null);
      setDialogData({ openingAmount: '', actualAmount: '', depositAmount: '', withdrawAmount: '', notes: '' });
      await fetchStatus();
    } catch (err) {
      setError('Failed to open cash register');
      console.error('Error opening register:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseRegister = async () => {
    try {
      setLoading(true);
      const result = await cashRegisterApi.close({
        actualAmount: parseFloat(dialogData.actualAmount) || 0,
        notes: dialogData.notes,
      });
      setOpenDialog(null);
      setDialogData({ openingAmount: '', actualAmount: '', depositAmount: '', withdrawAmount: '', notes: '' });
      await fetchStatus();
      
      // Show reconciliation info
      const reconciliation = result.reconciliation;
      alert(`Register closed successfully!\nExpected: $${reconciliation.expectedAmount.toFixed(2)}\nActual: $${reconciliation.actualAmount.toFixed(2)}\nDifference: $${reconciliation.difference.toFixed(2)}`);
    } catch (err) {
      setError('Failed to close cash register');
      console.error('Error closing register:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    try {
      setLoading(true);
      await cashRegisterApi.deposit({
        amount: parseFloat(dialogData.depositAmount) || 0,
        notes: dialogData.notes,
      });
      setOpenDialog(null);
      setDialogData({ openingAmount: '', actualAmount: '', depositAmount: '', withdrawAmount: '', notes: '' });
      await fetchStatus();
    } catch (err) {
      setError('Failed to deposit money');
      console.error('Error depositing:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      setLoading(true);
      await cashRegisterApi.withdraw({
        amount: parseFloat(dialogData.withdrawAmount) || 0,
        notes: dialogData.notes,
      });
      setOpenDialog(null);
      setDialogData({ openingAmount: '', actualAmount: '', depositAmount: '', withdrawAmount: '', notes: '' });
      await fetchStatus();
    } catch (err) {
      setError('Failed to withdraw money');
      console.error('Error withdrawing:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'SALE': return <AttachMoney color="success" />;
      case 'DEPOSIT': return <Add color="success" />;
      case 'WITHDRAWAL': return <Remove color="error" />;
      case 'RETURN': return <Remove color="warning" />;
      case 'OPENING': return <LockOpen color="primary" />;
      case 'CLOSING': return <Lock color="primary" />;
      default: return <AttachMoney />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'SALE':
      case 'DEPOSIT':
      case 'OPENING':
        return 'success';
      case 'WITHDRAWAL':
      case 'RETURN':
        return 'error';
      case 'CLOSING':
        return 'primary';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Cash Register
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Status Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6" gutterBottom>
                Register Status
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Chip
                  icon={status?.isOpen ? <LockOpen /> : <Lock />}
                  label={status?.isOpen ? 'OPEN' : 'CLOSED'}
                  color={status?.isOpen ? 'success' : 'error'}
                  variant="outlined"
                />
                {status?.isOpen && (
                  <Typography variant="h5" color="primary">
                    ${(Number(status.currentBalance) || 0).toFixed(2)}
                  </Typography>
                )}
              </Box>
            </Box>
            <AccountBalance sx={{ fontSize: 48, color: 'primary.main' }} />
          </Box>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {!status?.isOpen ? (
          <Grid item>
            <Button
              variant="contained"
              startIcon={<LockOpen />}
              onClick={() => setOpenDialog('open')}
              color="success"
            >
              Open Register
            </Button>
          </Grid>
        ) : (
          <>
            <Grid item>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setOpenDialog('deposit')}
                color="success"
              >
                Deposit
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                startIcon={<Remove />}
                onClick={() => setOpenDialog('withdraw')}
                color="warning"
              >
                Withdraw
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                startIcon={<History />}
                onClick={() => setShowMovements(!showMovements)}
                color="info"
              >
                {showMovements ? 'Hide' : 'Show'} Movements
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                startIcon={<Lock />}
                onClick={() => setOpenDialog('close')}
                color="error"
              >
                Close Register
              </Button>
            </Grid>
          </>
        )}
      </Grid>

      {/* Movements List */}
      {showMovements && status?.isOpen && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Movements
            </Typography>
            <List>
              {movements.slice(0, 10).map((movement) => (
                <ListItem key={movement.id} divider>
                  <ListItemIcon>
                    {getMovementIcon(movement.movementType)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle1">
                          {movement.movementType}
                        </Typography>
                        <Chip
                          label={`$${(Number(movement.amount) || 0).toFixed(2)}`}
                          color={getMovementColor(movement.movementType) as any}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Balance: ${(Number(movement.previousBalance) || 0).toFixed(2)} → ${(Number(movement.newBalance) || 0).toFixed(2)}
                        </Typography>
                        {movement.notes && (
                          <Typography variant="body2" color="text.secondary">
                            {movement.notes}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {new Date(movement.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      {/* Open Register Dialog */}
      <Dialog open={openDialog === 'open'} onClose={() => setOpenDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Open Cash Register</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Opening Amount"
            type="number"
            value={dialogData.openingAmount}
            onChange={(e) => setDialogData({ ...dialogData, openingAmount: e.target.value })}
            margin="normal"
            inputProps={{ step: "0.01", min: "0" }}
          />
          <TextField
            fullWidth
            label="Notes"
            value={dialogData.notes}
            onChange={(e) => setDialogData({ ...dialogData, notes: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(null)}>Cancel</Button>
          <Button onClick={handleOpenRegister} variant="contained" color="success">
            Open Register
          </Button>
        </DialogActions>
      </Dialog>

      {/* Close Register Dialog */}
      <Dialog open={openDialog === 'close'} onClose={() => setOpenDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Close Cash Register</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Expected Amount: ${(Number(status?.currentBalance) || 0).toFixed(2)}
          </Alert>
          <TextField
            fullWidth
            label="Actual Amount"
            type="number"
            value={dialogData.actualAmount}
            onChange={(e) => setDialogData({ ...dialogData, actualAmount: e.target.value })}
            margin="normal"
            inputProps={{ step: "0.01", min: "0" }}
          />
          <TextField
            fullWidth
            label="Notes"
            value={dialogData.notes}
            onChange={(e) => setDialogData({ ...dialogData, notes: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(null)}>Cancel</Button>
          <Button onClick={handleCloseRegister} variant="contained" color="error">
            Close Register
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deposit Dialog */}
      <Dialog open={openDialog === 'deposit'} onClose={() => setOpenDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Deposit Money</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Amount"
            type="number"
            value={dialogData.depositAmount}
            onChange={(e) => setDialogData({ ...dialogData, depositAmount: e.target.value })}
            margin="normal"
            inputProps={{ step: "0.01", min: "0" }}
          />
          <TextField
            fullWidth
            label="Notes"
            value={dialogData.notes}
            onChange={(e) => setDialogData({ ...dialogData, notes: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(null)}>Cancel</Button>
          <Button onClick={handleDeposit} variant="contained" color="success">
            Deposit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={openDialog === 'withdraw'} onClose={() => setOpenDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Withdraw Money</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Current Balance: ${(Number(status?.currentBalance) || 0).toFixed(2)}
          </Alert>
          <TextField
            fullWidth
            label="Amount"
            type="number"
            value={dialogData.withdrawAmount}
            onChange={(e) => setDialogData({ ...dialogData, withdrawAmount: e.target.value })}
            margin="normal"
            inputProps={{ step: "0.01", min: "0" }}
          />
          <TextField
            fullWidth
            label="Notes"
            value={dialogData.notes}
            onChange={(e) => setDialogData({ ...dialogData, notes: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(null)}>Cancel</Button>
          <Button onClick={handleWithdraw} variant="contained" color="warning">
            Withdraw
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CashRegister; 