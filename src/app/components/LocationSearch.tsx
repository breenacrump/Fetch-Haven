import { useState, useEffect } from "react";
import {
    Box,
    FormControl,
    Select,
    MenuItem,
    TextField,
    Button,
    Chip,
    Paper,
    Autocomplete,
    AutocompleteRenderGetTagProps,
    FormControlLabel,
    Switch,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import LocationOn from "@mui/icons-material/LocationOn";
import { searchRadiusOptions, states } from "@/const/locationSearch";

export default function LocationSearch({
    onLocationChange,
    setIsLoadingDogs,
    onSearchStateChange,
}: {
    onLocationChange: (zipCodes: string[]) => void;
    setIsLoadingDogs: (isLoading: boolean) => void;
    onSearchStateChange: (isLocationSearchActive: boolean) => void;
}) {
    const [selectedStates, setSelectedStates] = useState<string[]>([]);
    const [city, setCity] = useState<string>("");
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

    useEffect(() => {
        const isSearching = !!(city || selectedStates.length || useMyLocation);
        onSearchStateChange(isSearching);
    }, [city, selectedStates, useMyLocation, onSearchStateChange]);

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
        // Roughly 1 degree of latitude is about 69 miles
        const boxSize = radius / 69;
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
                        states: selectedStates.length ? selectedStates : undefined,
                        geoBoundingBox,
                        size: 100,
                    }),
                }
            );
            const data = await response.json();
            const newZipCodes = data.results.map(
                (location: { zip_code: string }) => location.zip_code
            );
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
        setSearchRadius(50);
        onLocationChange([]);
        onSearchStateChange(false);
    };

    const handleUseMyLocation = () => {
        setIsLoadingDogs(true);
        setSelectedStates([]);
        setCity("");
        setCurrentLocation();
        onSearchStateChange(false);
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
                                    helperText={useMyLocation ? "States selection is disabled when using your location." : ""}
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
                        helperText={useMyLocation ? "City input is disabled when using your location." : ""}
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
                                    <LocationOn
                                        fontSize="small"
                                        className="text-blue-500"
                                    />
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
