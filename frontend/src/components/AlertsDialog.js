/**
 * AlertsDialog Component
 * Displays alerts in a dialog with filtering and actions
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Box,
  Typography,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning,
  Info,
  CheckCircle,
  Close,
  Refresh,
} from '@mui/icons-material';
import { format } from 'date-fns';

const AlertsDialog = ({ open, onClose, alerts, onRefresh, onAcknowledge }) => {
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const getSeverityConfig = (severity) => {
    switch (severity) {
      case 'critical':
        return { icon: <ErrorIcon />, color: 'error', bgcolor: 'error.light' };
      case 'high':
        return { icon: <Warning />, color: 'warning', bgcolor: 'warning.light' };
      case 'medium':
        return { icon: <Info />, color: 'info', bgcolor: 'info.light' };
      case 'low':
        return { icon: <CheckCircle />, color: 'success', bgcolor: 'success.light' };
      default:
        return { icon: <Info />, color: 'default', bgcolor: 'grey.300' };
    }
  };

  const getFilteredAlerts = () => {
    if (!alerts) return [];
    
    let filtered = [...alerts];
    
    if (severityFilter !== 'all') {
      filtered = filtered.filter(alert => alert.severity === severityFilter);
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(alert => alert.status === statusFilter);
    }
    
    return filtered;
  };

  const filteredAlerts = getFilteredAlerts();

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">System Alerts</Typography>
          <Box display="flex" gap={1}>
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={onRefresh}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <IconButton size="small" onClick={onClose}>
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Filters */}
        <Box display="flex" gap={2} mb={2}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Severity</InputLabel>
            <Select
              value={severityFilter}
              label="Severity"
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <MenuItem value="all">All Severities</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {filteredAlerts.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="body2" color="text.secondary">
              No alerts to display
            </Typography>
          </Box>
        ) : (
          <List>
            {filteredAlerts.map((alert, index) => {
              const config = getSeverityConfig(alert.severity);
              
              return (
                <React.Fragment key={alert.id || index}>
                  <ListItem alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: config.bgcolor }}>
                        {config.icon}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="body1" fontWeight="medium">
                            {alert.title || alert.alert_type}
                          </Typography>
                          <Chip
                            label={alert.severity}
                            color={config.color}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {alert.message || alert.description}
                          </Typography>
                          <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                            <Chip
                              label={alert.status}
                              size="small"
                              variant="outlined"
                              color={alert.status === 'active' ? 'warning' : 'success'}
                            />
                            {alert.created_at && (
                              <Typography variant="caption" color="text.secondary">
                                {format(new Date(alert.created_at), 'PPp')}
                              </Typography>
                            )}
                            {alert.status === 'active' && onAcknowledge && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => onAcknowledge(alert.id)}
                              >
                                Acknowledge
                              </Button>
                            )}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < filteredAlerts.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AlertsDialog;