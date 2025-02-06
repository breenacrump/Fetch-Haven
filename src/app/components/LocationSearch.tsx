import { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  Paper,
  Autocomplete,
  AutocompleteRenderGetTagProps
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ClearIcon from '@mui/icons-material/Clear';

export default function LocationSearch({ onLocationChange }: { onLocationChange: (zipCodes: string[]) => void }) {
  const [states, setStates] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [city, setCity] = useState('');
  const [zipCodes, setZipCodes] = useState<string[]>([]);
  const [boundingBox, setBoundingBox] = useState<{ bottom_left: { lat: number, lon: number }, top_right: { lat: number, lon: number } } | null>(null);

  useEffect(() => {
    fetchStates();
  }, []);

  // Automatically search when criteria changes
  useEffect(() => {
    if (city || selectedStates.length > 0 || boundingBox) {
      searchLocations();
    }
  }, [city, selectedStates, boundingBox]);

  // Get user's current location to center the search
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Create a bounding box around the user's location (roughly 50 mile radius)
          const boxSize = 0.7246; // roughly 50 miles in degrees
          setBoundingBox({
            bottom_left: {
              lat: latitude - boxSize,
              lon: longitude - boxSize
            },
            top_right: {
              lat: latitude + boxSize,
              lon: longitude + boxSize
            }
          });
          searchLocations();
        },
        (error) => console.error('Error getting location:', error)
      );
    }
  };

  const searchLocations = async () => {
    try {
      const response = await fetch('https://frontend-take-home-service.fetch.com/locations/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          city: city || undefined,
          states: selectedStates.length > 0 ? selectedStates : undefined,
          geoBoundingBox: boundingBox || undefined,
          size: 100
        })
      });

      const data = await response.json();
      const newZipCodes = data.results.map((location: { zip_code: string }) => location.zip_code);
      setZipCodes(newZipCodes);
      onLocationChange(newZipCodes);
    } catch (error) {
      console.error('Error searching locations:', error);
    }
  };

  // Get unique states from the sample location data
  const fetchStates = async () => {
    try {
      // This would ideally come from an API endpoint
      // For now, using a subset of US states
      setStates([
        'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
        'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
        'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
        'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
        'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
      ]);
    } catch (error) {
      console.error('Error fetching states:', error);
    }
  };

  const clearAllLocations = () => {
    setSelectedStates([]);
    setCity('');
    setBoundingBox(null);
    setZipCodes([]);
    onLocationChange([]);
  };

  return (
    <Paper className="p-4 mb-4 shadow-md">
      <h3 className="text-lg font-bold mb-4">Location Search</h3>
      <Box className="flex flex-col space-y-4">
        <Box className="flex flex-col sm:flex-row gap-4">
        <FormControl fullWidth>
            <Autocomplete
              multiple
              size="small"
              options={states}
              value={selectedStates}
              disableCloseOnSelect={true}
              openOnFocus={true}
              autoHighlight={true}
              filterSelectedOptions={true}
              onChange={(event: any, newValue: string[]) => {
                setSelectedStates(newValue);
              }}
              renderInput={(params: any) => (
                <TextField
                  {...params}
                  label="States"
                  placeholder="Select states"
                  size="small"
                />
              )}
              renderTags={(value: string[], getTagProps: AutocompleteRenderGetTagProps) => 
                value.map((option: string, index: number) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    size="small"
                    key={option}
                  />
                ))
              }
            />
          </FormControl>
          
          <TextField
            label="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            fullWidth={true}
            size="small"
          />
        </Box>

        <Box className="flex justify-between items-center">
          <Button
            startIcon={<LocationOnIcon />}
            variant="outlined"
            onClick={getCurrentLocation}
          >
            Use My Location
          </Button>

          <Button
              startIcon={<ClearIcon />}
              variant="outlined"
              onClick={clearAllLocations}
              size="small"
              color="error"
            >
              Clear Location
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}