import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  AutocompleteRenderGetTagProps,
  FormControlLabel,
  Switch    
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ClearIcon from '@mui/icons-material/Clear';
import {useDidMountEffect} from '@/hooks/useDidMountEffect';
import LocationOn from '@mui/icons-material/LocationOn';
import { searchRadiusOptions, states } from '@/const/locationSearch';

export default function LocationSearch({
    onLocationChange,
    setIsLoadingDogs,
}: {
    onLocationChange: (zipCodes: string[]) => void;
    setIsLoadingDogs: (isLoading: boolean) => void;
}) {
    const [selectedStates, setSelectedStates] = useState<string[]>([]);
    const [city, setCity] = useState<string>("");
    const [zipCodes, setZipCodes] = useState<string[]>([]);
    const [currentLocationBoundingBox, setCurrentLocationBoundingBox] =
        useState<{
            bottom_left: { lat: number; lon: number };
            top_right: { lat: number; lon: number };
        } | null>(null);
    const [searchRadius, setSearchRadius] = useState<number>(50);
    const [useMyLocation, setUseMyLocation] = useState<boolean>(false);

    useEffect(() => {
        if (!city && !selectedStates.length) {
            if (!useMyLocation) {
                onLocationChange([]);
            }
            return;
        }
        searchLocations();
    }, [city, selectedStates]);

    useEffect(() => {
        if (useMyLocation) {
            searchLocations();
        }
    }, [currentLocationBoundingBox, searchRadius]);

    const setCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setCurrentLocationBoundingBox(
                        calculateBoundingBox(latitude, longitude, searchRadius)
                    );
                },
                (error) => console.error("Error getting location:", error)
            );
        }
    };

    const calculateBoundingBox = (
        latitude: number,
        longitude: number,
        radius: number
    ) => {
        const boxSize = radius / 69; // Roughly 1 degree of latitude is about 69 miles
        return {
            bottom_left: {
                lat: latitude - boxSize,
                lon: longitude - boxSize,
            },
            top_right: {
                lat: latitude + boxSize,
                lon: longitude + boxSize,
            },
        };
    };

    const searchLocations = async () => {
        try {
            const geoBoundingBox = useMyLocation
                ? currentLocationBoundingBox
                : undefined;
            const response = await fetch(
                "https://frontend-take-home-service.fetch.com/locations/search",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        city: city || undefined,
                        states:
                            selectedStates.length > 0
                                ? selectedStates
                                : undefined,
                        geoBoundingBox,
                        size: 100,
                    }),
                }
            );

            const data = await response.json();
            const newZipCodes = data.results.map(
                (location: { zip_code: string }) => location.zip_code
            );
            setZipCodes(newZipCodes);
            onLocationChange(newZipCodes);
        } catch (error) {
            console.error("Error searching locations:", error);
        }
    };

    const clearAllLocations = () => {
        setUseMyLocation(false);
        setSelectedStates([]);
        setCity("");
        setCurrentLocationBoundingBox(null);
        setZipCodes([]);
        setSearchRadius(50);
        onLocationChange([]);
    };

    const handleUseMyLocation = () => {
        setIsLoadingDogs(true);
        setSelectedStates([]);
        setCity("");
        setCurrentLocation();
    };

    return (
        <Paper className="p-4 mb-4 shadow-md">
            <h3 className="text-lg font-bold mb-4">Location Filter</h3>
            <Box className="flex flex-col space-y-4">
                <Box className="flex flex-col sm:flex-row gap-4">
                    <FormControl fullWidth>
                        <Autocomplete
                            multiple={true}
                            size="small"
                            options={states}
                            value={selectedStates}
                            disableCloseOnSelect={true}
                            openOnFocus={true}
                            autoHighlight={true}
                            filterSelectedOptions={true}
                            disabled={useMyLocation}
                            onChange={(event, newValues, reason) => {
                                if (reason === "clear" || !newValues.length) {
                                    setSelectedStates([]);
                                } else {
                                    setSelectedStates(newValues);
                                }
                            }}
                            renderInput={(params: any) => (
                                <TextField
                                    {...params}
                                    label="States"
                                    placeholder="Select states"
                                    size="small"
                                    disabled={useMyLocation}
                                />
                            )}
                            renderTags={(
                                value: string[],
                                getTagProps: AutocompleteRenderGetTagProps
                            ) =>
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
                        disabled={useMyLocation}
                    />
                </Box>

                <Box className="flex items-center">
                    <Box className="flex items-center">
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={useMyLocation}
                                    onChange={(e) => {
                                        setUseMyLocation(e.target.checked);
                                        if (e.target.checked) {
                                            handleUseMyLocation();
                                        } else {
                                            onLocationChange([]);
                                        }
                                    }}
                                />
                            }
                            label={
                                <span className="flex items-center gap">
                                    <LocationOn fontSize="small" className='text-blue-500' />
                                    Use My Location
                                </span>
                            }
                        />
                    </Box>
                    {useMyLocation && (
                        <FormControl className="w-[160px] flex flex-row">
                            <div id="search-radius-label mb-8">
                                Search Radius (miles)
                            </div>
                            <Select
                                labelId="search-radius-label"
                                value={searchRadius}
                                onChange={(e) =>
                                    setSearchRadius(e.target.value as number)
                                }
                                size="small"
                            >
                                {searchRadiusOptions.map((value) => (
                                    <MenuItem key={value} value={value}>
                                        {value}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                    <Box className="ml-auto">
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
            </Box>
        </Paper>
    );
}