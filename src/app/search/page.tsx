"use client";

import { useState, useEffect, SyntheticEvent } from "react";
import { useSession } from "@/context/SessionContext";
import { useRouter } from "next/navigation";
import {
    Container,
    Box,
    Paper,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Pagination,
    Chip,
    Autocomplete,
    TextField,
    CircularProgress,
} from "@mui/material";
import DogCard from "@/components/DogCard";
import FavoritesList from "@/components/FavoritesList";
import LogoutIcon from "@mui/icons-material/Logout";
import LocationSearch from "@/components/LocationSearch";
import { Dog } from "@/components/DogCard";

export default function SearchPage() {
    const { isAuthenticated, logout, user } = useSession();
    const router = useRouter();
    const [breeds, setBreeds] = useState([]);
    const [selectedBreed, setSelectedBreed] = useState<string[]>([]);
    const [dogs, setDogs] = useState([]);
    const [favorites, setFavorites] = useState<{ id: string }[]>([]);
    const [sortOrder, setSortOrder] = useState("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showMatch, setShowMatch] = useState(false);
    const [matchedDog, setMatchedDog] = useState<Dog | null>(null);
    const [zipCodes, setZipCodes] = useState<string[]>([]);
    const [isLoadingBreeds, setIsLoadingBreeds] = useState(true);
    const [errorLoadingBreeds, setErrorLoadingBreeds] = useState<string | null>(null);
    const [pageSize, setPageSize] = useState(24);
    const [isLoadingDogs, setIsLoadingDogs] = useState(true);
    const [ageMin, setAgeMin] = useState<string>("");
    const [ageMax, setAgeMax] = useState<string>("");
    const [isLocationSearchActive, setIsLocationSearchActive] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/");
            return;
        }
        fetchBreeds();
    }, [isAuthenticated]);

    useEffect(() => {
        fetchDogs();
    }, [
        selectedBreed,
        sortOrder,
        currentPage,
        zipCodes,
        pageSize,
        ageMin,
        ageMax,
        isLocationSearchActive,
    ]);

    useEffect(() => {
        if (!favorites.length || (matchedDog && !favorites.some(dog => dog.id === matchedDog.id))) {
            setMatchedDog(null);
        }
    }, [favorites]);

    const fetchBreeds = async () => {
        try {
            const response = await fetch(
                "https://frontend-take-home-service.fetch.com/dogs/breeds",
                {
                    credentials: "include",
                }
            );
            const data = await response.json();
            setBreeds(data);
            setIsLoadingBreeds(false);
        } catch (error) {
            setErrorLoadingBreeds((error as Error).message);
            console.error("Error fetching breeds:", error);
        }
    };

    const fetchDogs = async () => {
        try {
            setIsLoadingDogs(true);

            if (isLocationSearchActive && zipCodes.length === 0) {
                setDogs([]);
                setTotalPages(0);
                setIsLoadingDogs(false);
                return;
            }

            const applyFilters = (params: URLSearchParams) => {
                if (selectedBreed.length) {
                    selectedBreed.forEach((breed) => {
                        params.append("breeds", breed);
                    });
                }
                if (zipCodes.length) {
                    zipCodes.forEach((zip) => {
                        params.append("zipCodes", zip);
                    });
                }
                if (ageMin) {
                    params.append("ageMin", ageMin);
                }
                if (ageMax) {
                    params.append("ageMax", ageMax);
                }
                return params;
            };

            const countQueryParams = applyFilters(
                new URLSearchParams({
                    sort: `breed:${sortOrder}`,
                })
            );

            const countResponse = await fetch(
                `https://frontend-take-home-service.fetch.com/dogs/search?${countQueryParams}`,
                { credentials: "include" }
            );

            const countData = await countResponse.json();
            const totalResults = countData.total;

            const maxFrom = Math.max(0, totalResults - pageSize);
            const from = Math.min((currentPage - 1) * pageSize, maxFrom);

            const queryParams = applyFilters(
                new URLSearchParams({
                    sort: `breed:${sortOrder}`,
                    size: pageSize.toString(),
                    from: from.toString(),
                })
            );

            const response = await fetch(
                `https://frontend-take-home-service.fetch.com/dogs/search?${queryParams}`,
                { credentials: "include" }
            );
            const searchData = await response.json();

            const dogsResponse = await fetch(
                "https://frontend-take-home-service.fetch.com/dogs",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(searchData.resultIds),
                    credentials: "include",
                }
            );
            
            const dogsData = await dogsResponse.json();
            setDogs(dogsData);
            setIsLoadingDogs(false);
            setTotalPages(Math.ceil(searchData.total / pageSize));
        } catch (error) {
            console.error("Error fetching dogs:", error);
        }
    };

    const generateMatch = async () => {
        try {
            const response = await fetch(
                "https://frontend-take-home-service.fetch.com/dogs/match",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(favorites.map((dog) => dog.id)),
                    credentials: "include",
                }
            );

            const { match } = await response.json();
            const matchedDog =
                favorites.find((dog) => dog.id === match) as Dog | null;
            setMatchedDog(matchedDog);
            setShowMatch(true);
        } catch (error) {
            console.error("Error generating match:", error);
        }
    };

    const toggleFavorite = (toggledDog: Dog) => {
        setFavorites((prev) => {
            const exists = prev.find((dog) => dog.id === toggledDog.id);
            if (exists) {
                return prev.filter((dog) => dog.id !== toggledDog.id);
            }
            return [...prev, toggledDog];
        });
    };

    const handleChange = (event: SyntheticEvent<Element, Event>, newValue: string[]) => {
        setSelectedBreed(newValue);
        setCurrentPage(1);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <Container maxWidth="xl">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-700">
                        {user?.name
                            ? `Welcome to Fetch Haven Adoption, ${user?.name}!`
                            : "Welcome to Fetch Haven Adoption!"}
                    </h1>
                    <Button
                        variant="outlined"
                        startIcon={<LogoutIcon />}
                        onClick={logout}
                        className="ml-4"
                    >
                        Logout
                    </Button>
                </div>

                <Box className="flex flex-col lg:flex-row gap-6">
                    <Box className="flex-1">
                        <Paper className="p-4 mb-4">
                            <Box className="flex flex-col gap-4">
                                <Box className="flex flex-col sm:flex-row gap-4">
                                    <FormControl fullWidth>
                                        <Autocomplete
                                            multiple
                                            id="breed-select"
                                            options={breeds}
                                            loading={isLoadingBreeds}
                                            onChange={handleChange}
                                            getOptionLabel={(option) => option}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Breeds"
                                                    placeholder="Search breeds..."
                                                    error={!!errorLoadingBreeds}
                                                    helperText={errorLoadingBreeds}
                                                    slotProps={{
                                                        input: {
                                                            ...params.InputProps,
                                                            endAdornment: (
                                                                <>
                                                                    {isLoadingBreeds ? (
                                                                        <CircularProgress
                                                                            color="inherit"
                                                                            size={20}
                                                                        />
                                                                    ) : null}
                                                                    {params.InputProps?.endAdornment}
                                                                </>
                                                            ),
                                                        },
                                                    }}
                                                />
                                            )}
                                            renderTags={(value, getTagProps) =>
                                                value.map((option, index) => (
                                                    <Chip
                                                        label={option}
                                                        {...getTagProps({
                                                            index,
                                                        })}
                                                        color="primary"
                                                        variant="outlined"
                                                        key={option}
                                                    />
                                                ))
                                            }
                                            filterSelectedOptions
                                            isOptionEqualToValue={(
                                                option,
                                                value
                                            ) => option === value}
                                        />
                                    </FormControl>

                                    <FormControl fullWidth>
                                        <InputLabel>Sort Order</InputLabel>
                                        <Select
                                            value={sortOrder}
                                            label="Sort Order"
                                            onChange={(e) =>
                                                setSortOrder(e.target.value)
                                            }
                                        >
                                            <MenuItem value="asc">
                                                Sort A-Z
                                            </MenuItem>
                                            <MenuItem value="desc">
                                                Sort Z-A
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>

                                <Box className="flex flex-col sm:flex-row gap-4">
                                    <TextField
                                        className="w-1/5"
                                        label="Minimum Age"
                                        type="text"
                                        value={ageMin}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (/^\d*$/.test(value)) {
                                                setAgeMin(value);
                                                setCurrentPage(1);
                                            }
                                        }}
                                        helperText="Enter minimum age"
                                        slotProps={{
                                            input: {
                                                inputProps: {
                                                    inputMode: "numeric",
                                                    pattern: "[0-9]*",
                                                    min: 0,
                                                },
                                            },
                                        }}
                                    />
                                    <TextField
                                        className="w-1/5"
                                        label="Maximum Age"
                                        type="text"
                                        value={ageMax}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (/^\d*$/.test(value)) {
                                                setAgeMax(value);
                                                setCurrentPage(1);
                                            }
                                        }}
                                        error={
                                            ageMax !== "" &&
                                            ageMin !== "" &&
                                            Number(ageMax) < Number(ageMin)
                                        }
                                        helperText={
                                            ageMax !== "" &&
                                            ageMin !== "" &&
                                            Number(ageMax) < Number(ageMin)
                                                ? "Maximum age must be greater than minimum age"
                                                : "Enter maximum age"
                                        }
                                        slotProps={{
                                            input: {
                                                inputProps: {
                                                    inputMode: "numeric",
                                                    pattern: "[0-9]*",
                                                    min: 0,
                                                },
                                            },
                                        }}
                                    />
                                </Box>
                                <LocationSearch
                                    onLocationChange={(
                                        newZipCodes: string[]
                                    ) => {
                                        setZipCodes(newZipCodes);
                                        setCurrentPage(1);
                                    }}
                                    setIsLoadingDogs={setIsLoadingDogs}
                                    onSearchStateChange={setIsLocationSearchActive}
                                />
                            </Box>
                        </Paper>
                        {isLoadingDogs ? (
                            <div className="flex justify-center items-center min-h-[500px]">
                                <CircularProgress size={40} thickness={4} />
                            </div>
                        ) : !dogs.length ? (
                            <div className="flex justify-center items-center min-h-[500px] flex-col gap-4">
                                <h2 className="text-lg font-bold text-gray-700">Unfortunately, we could not find any dogs that match your criteria.</h2>
                                <h2 className="text-lg font-bold text-gray-700">Every dog deserves a loving home. Please consider expanding your search criteria.</h2>
                            </div>
                        ) : (
                            <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {dogs.map((dog: Dog) => (
                                    <DogCard
                                        key={dog.id}
                                        dog={dog}
                                        isFavorite={favorites.some(
                                            (favoriteDog) => favoriteDog.id === dog.id
                                        )}
                                        onFavoriteToggle={() =>
                                            toggleFavorite(dog)
                                        }
                                    />
                                ))}
                            </Box>
                        )}
                        <Box className="flex justify-center mt-8 mb-20">
                            <Pagination
                                count={totalPages}
                                page={currentPage}
                                onChange={(e, page) => setCurrentPage(page)}
                                color="primary"
                            />
                            <FormControl className="w-[80px]">
                                <InputLabel>Page Size</InputLabel>
                                <Select
                                    className="h-[35px]"
                                    value={pageSize}
                                    label="Page Size"
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                >
                                    <MenuItem value={24}>24</MenuItem>
                                    <MenuItem value={36}>36</MenuItem>
                                    <MenuItem value={48}>48</MenuItem>
                                    <MenuItem value={60}>100</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>

                    <Box className="w-full lg:w-80">
                        <FavoritesList
                            favorites={favorites as { id: string; name: string; breed: string }[]}
                            onRemove={(dog: { id: string; name: string; breed: string }) => toggleFavorite(dog as Dog)}
                            onGenerateMatch={generateMatch}
                        />
                        {showMatch && matchedDog && (
                            <Paper className="mt-4 p-4">
                                <h2 className="text-xl font-bold mb-4">
                                    Your Match!
                                </h2>
                                <DogCard
                                    dog={matchedDog}
                                    isFavorite={true}
                                    showFavorite={false}
                                />
                            </Paper>
                        )}
                    </Box>
                </Box>
            </Container>
        </div>
    );
}
