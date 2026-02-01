import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    Pressable,
    ScrollView,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AddressModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (address: AddressData) => void;
    currentAddress?: AddressData;
}

export interface AddressData {
    region: string;
    regionCode?: string;
    city: string;
    cityCode?: string;
    barangay: string;
    barangayCode?: string;
    street?: string;
    postalCode: string; // Required
}

interface Region {
    name: string;
    code: string;
}

interface City {
    name: string;
    code: string;
    type: 'city' | 'municipality';
}

interface Barangay {
    name: string;
    code?: string;
}

const PSGC_API = 'https://psgc.gitlab.io/api';

/**
 * Reformats PSGC city/municipality names
 */
const formatCityName = (raw: string): string => {
    if (raw.startsWith('City of ')) {
        return raw.replace('City of ', '').trim() + ' City';
    }
    if (raw.startsWith('Municipality of ')) {
        return raw.replace('Municipality of ', '').trim();
    }
    return raw;
};

export default function AddressModal({
    visible,
    onClose,
    onSave,
    currentAddress,
}: AddressModalProps) {
    // ========== STATE ==========
    const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
    const [selectedCity, setSelectedCity] = useState<City | null>(null);
    const [selectedBarangay, setSelectedBarangay] = useState<Barangay | null>(null);
    const [streetAddress, setStreetAddress] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [postalCodeError, setPostalCodeError] = useState<string>('');
    const [validPostalCodes, setValidPostalCodes] = useState<string[]>([]);
    const [loadingPostalCodes, setLoadingPostalCodes] = useState(false);

    const [showRegionDropdown, setShowRegionDropdown] = useState(false);
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [showBarangayDropdown, setShowBarangayDropdown] = useState(false);

    const [regions, setRegions] = useState<Region[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [barangays, setBarangays] = useState<Barangay[]>([]);

    const [loadingRegions, setLoadingRegions] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingBarangays, setLoadingBarangays] = useState(false);
    const [regionSearch, setRegionSearch] = useState('');
    const [citySearch, setCitySearch] = useState('');
    const [barangaySearch, setBarangaySearch] = useState('');

    // Track whether we're in the initial loading phase
    const [isLoadingInitialAddress, setIsLoadingInitialAddress] = useState(false);

    // ========== EFFECTS ==========

    // Step 1: When modal opens, fetch regions and initialize
    useEffect(() => {
        if (visible) {
            setIsLoadingInitialAddress(!!currentAddress);
            fetchRegions();
        } else {
            // Reset when modal closes
            handleClose();
        }
    }, [visible]);

    // Step 2: Fetch and set region (only if we have regions data and currentAddress)
    useEffect(() => {
        if (isLoadingInitialAddress && currentAddress && regions.length > 0 && !selectedRegion) {
            console.log('📍 Loading existing address:', currentAddress);
            
            const region = currentAddress.regionCode
                ? regions.find(r => r.code === currentAddress.regionCode)
                : regions.find(r => r.name === currentAddress.region);

            if (region) {
                console.log('✅ Found existing region:', region.name);
                setSelectedRegion(region);
            }
        }
    }, [regions, isLoadingInitialAddress, currentAddress, selectedRegion]);

    // Step 3: When region is selected, fetch cities
    useEffect(() => {
        if (selectedRegion) {
            // Set street and postal code early (they're static)
            if (isLoadingInitialAddress && currentAddress) {
                setStreetAddress(currentAddress.street || '');
                setPostalCode(currentAddress.postalCode || '');
            }
            fetchCities(selectedRegion.code);
        }
    }, [selectedRegion]);

    // Step 4: When cities are loaded, select the current city (if in initial load)
    useEffect(() => {
        if (isLoadingInitialAddress && currentAddress && cities.length > 0 && selectedRegion && !selectedCity) {
            const city = currentAddress.cityCode
                ? cities.find(c => c.code === currentAddress.cityCode)
                : cities.find(c => c.name === currentAddress.city);

            if (city) {
                console.log('✅ Found existing city:', city.name);
                setSelectedCity(city);
            }
        }
    }, [cities, isLoadingInitialAddress, currentAddress, selectedRegion, selectedCity]);

    // Step 5: When city is selected, fetch barangays and postal codes
    useEffect(() => {
        if (selectedCity && selectedRegion) {
            fetchBarangays(selectedRegion.code, selectedCity.code, selectedCity.type);
            fetchPostalCodesForCity(selectedCity.code);
        }
    }, [selectedCity]);

    // Step 6: When barangays are loaded, select the current barangay (if in initial load)
    useEffect(() => {
        if (isLoadingInitialAddress && currentAddress && barangays.length > 0 && selectedCity && !selectedBarangay) {
            const barangay = currentAddress.barangayCode
                ? barangays.find(b => b.code === currentAddress.barangayCode)
                : barangays.find(b => b.name === currentAddress.barangay);

            if (barangay) {
                console.log('✅ Found existing barangay:', barangay.name);
                setSelectedBarangay(barangay);
                setIsLoadingInitialAddress(false); // Done with initial load
            }
        }
    }, [barangays, isLoadingInitialAddress, currentAddress, selectedCity, selectedBarangay]);

    // Validate postal code whenever it changes
    useEffect(() => {
        if (postalCode) {
            validatePostalCode(postalCode);
        } else {
            setPostalCodeError('Postal code is required');
        }
    }, [postalCode, validPostalCodes]);

    // ========== API FUNCTIONS ==========

    const fetchRegions = async () => {
        setLoadingRegions(true);
        try {
            const response = await fetch(`${PSGC_API}/regions`);
            const data = await response.json();
            setRegions(data.map((item: any) => ({ name: item.name, code: item.code })));
        } catch (error) {
            console.error('❌ Error fetching regions:', error);
            Alert.alert('Error', 'Failed to load regions. Please try again.');
        } finally {
            setLoadingRegions(false);
        }
    };

    const fetchCities = async (regionCode: string) => {
        setLoadingCities(true);
        setCities([]); // Clear cities first
        try {
            const [citiesRes, muniRes] = await Promise.all([
                fetch(`${PSGC_API}/regions/${regionCode}/cities`),
                fetch(`${PSGC_API}/regions/${regionCode}/municipalities`),
            ]);

            const citiesData = await citiesRes.json();
            const muniData = await muniRes.json();

            const merged: City[] = [
                ...citiesData.map((item: any) => ({
                    name: formatCityName(item.name),
                    code: item.code,
                    type: 'city' as const,
                })),
                ...muniData.map((item: any) => ({
                    name: formatCityName(item.name),
                    code: item.code,
                    type: 'municipality' as const,
                })),
            ];

            merged.sort((a, b) => a.name.localeCompare(b.name));
            setCities(merged);
            console.log('✅ Loaded', merged.length, 'cities/municipalities');
        } catch (error) {
            console.error('❌ Error fetching cities:', error);
            Alert.alert('Error', 'Failed to load cities. Please try again.');
        } finally {
            setLoadingCities(false);
        }
    };

    const fetchBarangays = async (
        regionCode: string,
        cityCode: string,
        cityType: 'city' | 'municipality'
    ) => {
        setLoadingBarangays(true);
        setBarangays([]); // Clear barangays first
        try {
            const endpoint =
                cityType === 'city'
                    ? `${PSGC_API}/cities/${cityCode}/barangays`
                    : `${PSGC_API}/municipalities/${cityCode}/barangays`;

            console.log('📍 Fetching barangays from:', endpoint);
            const response = await fetch(endpoint);
            const data = await response.json();

            setBarangays(
                data.map((item: any) => ({
                    name: item.name,
                    code: item.code,
                }))
            );
            console.log('✅ Loaded', data.length, 'barangays');
        } catch (error) {
            console.error('❌ Error fetching barangays:', error);
            Alert.alert('Error', 'Failed to load barangays. Please try again.');
        } finally {
            setLoadingBarangays(false);
        }
    };

    /**
     * Fetch postal codes from PSGC API
     */
    const fetchPostalCodesForCity = async (cityCode: string) => {
        setLoadingPostalCodes(true);
        setValidPostalCodes([]);

        try {
            console.log('🔍 Fetching postal codes for city code:', cityCode);

            const response = await fetch(`${PSGC_API}/cities-municipalities/${cityCode}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch city details');
            }

            const cityData = await response.json();
            console.log('📦 City data:', cityData);

            if (cityData.zipCode || cityData.zipcode || cityData.postal_code) {
                const zipCode = cityData.zipCode || cityData.zipcode || cityData.postal_code;
                setValidPostalCodes([zipCode.toString()]);
                console.log('✅ Found postal code:', zipCode);
            } else {
                console.warn('⚠️ No postal code found in API for this city');
                setValidPostalCodes([]);
            }
        } catch (error) {
            console.error('❌ Error fetching postal codes:', error);
            setValidPostalCodes([]);
        } finally {
            setLoadingPostalCodes(false);
        }
    };

    /**
     * Validate postal code
     */
    const validatePostalCode = (code: string) => {
        if (!code || code.trim() === '') {
            setPostalCodeError('Postal code is required');
            return false;
        }

        if (!/^\d{4}$/.test(code)) {
            setPostalCodeError('Postal code must be exactly 4 digits');
            return false;
        }

        if (validPostalCodes.length > 0 && !validPostalCodes.includes(code)) {
            setPostalCodeError(
                `Invalid postal code for ${selectedCity?.name}. Valid code(s): ${validPostalCodes.join(', ')}`
            );
            return false;
        }

        setPostalCodeError('');
        return true;
    };

    // ========== FILTER FUNCTIONS ==========

    const filteredRegions = regions.filter((r) =>
        r.name.toLowerCase().includes(regionSearch.toLowerCase())
    );
    const filteredCities = cities.filter((c) =>
        c.name.toLowerCase().includes(citySearch.toLowerCase())
    );
    const filteredBarangays = barangays.filter((b) =>
        b.name.toLowerCase().includes(barangaySearch.toLowerCase())
    );

    // ========== HANDLERS ==========

    const handleSaveAddress = () => {
        if (!selectedRegion || !selectedCity || !selectedBarangay) {
            Alert.alert('Missing Information', 'Please select region, city, and barangay');
            return;
        }

        if (!postalCode || postalCode.trim() === '') {
            Alert.alert('Missing Postal Code', 'Postal code is required. Please enter your 4-digit postal code.');
            setPostalCodeError('Postal code is required');
            return;
        }

        if (!validatePostalCode(postalCode)) {
            Alert.alert(
                'Invalid Postal Code',
                postalCodeError || 'Please enter a valid 4-digit postal code for the selected city.'
            );
            return;
        }

        const addressData: AddressData = {
            region: selectedRegion.name,
            regionCode: selectedRegion.code,
            city: selectedCity.name,
            cityCode: selectedCity.code,
            barangay: selectedBarangay.name,
            barangayCode: selectedBarangay.code,
            street: streetAddress,
            postalCode: postalCode,
        };

        console.log('✅ Address saved:', addressData);
        onSave(addressData);
        handleClose();
    };

    const handleClose = () => {
        setSelectedRegion(null);
        setSelectedCity(null);
        setSelectedBarangay(null);
        setStreetAddress('');
        setPostalCode('');
        setPostalCodeError('');
        setValidPostalCodes([]);
        setRegionSearch('');
        setCitySearch('');
        setBarangaySearch('');
        setShowRegionDropdown(false);
        setShowCityDropdown(false);
        setShowBarangayDropdown(false);
        setIsLoadingInitialAddress(false);
        onClose();
    };

    // ========== DROPDOWN ITEM ==========

    const DropdownItem = ({
        item,
        isSelected,
        onPress,
    }: {
        item: Region | City | Barangay;
        isSelected: boolean;
        onPress: () => void;
    }) => (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => ({
                paddingVertical: 12,
                paddingHorizontal: 15,
                backgroundColor: isSelected ? '#22D3EE' : pressed ? '#1E293B' : '#0A1A3A',
                borderBottomWidth: 1,
                borderBottomColor: '#1E293B',
            })}
        >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text
                    style={{
                        color: isSelected ? '#000' : '#fff',
                        fontSize: 14,
                        fontWeight: isSelected ? '600' : '400',
                    }}
                >
                    {item.name}
                </Text>
                {isSelected && <Ionicons name="checkmark-circle" size={20} color="#000" />}
            </View>
        </Pressable>
    );

    // Check if save button should be enabled
    const isSaveDisabled =
        !selectedRegion ||
        !selectedCity ||
        !selectedBarangay ||
        !postalCode ||
        postalCode.trim() === '' ||
        postalCodeError !== '';

    // ========== RENDER ==========

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
                {/* Header */}
                <View
                    style={{
                        paddingTop: 15,
                        paddingBottom: 15,
                        paddingHorizontal: 20,
                        backgroundColor: '#1E293B',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>
                        {currentAddress ? 'Edit Address' : 'Add Address'}
                    </Text>
                    <Pressable onPress={handleClose}>
                        <Ionicons name="close" size={28} color="#fff" />
                    </Pressable>
                </View>

                <ScrollView style={{ flex: 1, padding: 20 }} showsVerticalScrollIndicator={false}>
                    {/* ===== REGION ===== */}
                    <View style={{ marginBottom: 20 }}>
                        <Text style={{ color: '#CBD5E1', fontSize: 12, marginBottom: 8, fontWeight: '500' }}>
                            Region <Text style={{ color: '#EF4444' }}>*</Text>
                        </Text>
                        <Pressable
                            onPress={() => {
                                setShowRegionDropdown(!showRegionDropdown);
                            }}
                            style={{
                                backgroundColor: '#0A1A3A',
                                borderRadius: 11,
                                paddingHorizontal: 15,
                                paddingVertical: 12,
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: selectedRegion ? '#22D3EE' : '#1E293B',
                            }}
                        >
                            <Text style={{ color: selectedRegion ? '#22D3EE' : '#9BB3D6', fontSize: 14 }}>
                                {selectedRegion?.name || 'Select Region'}
                            </Text>
                            <Ionicons
                                name={showRegionDropdown ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color="#22D3EE"
                            />
                        </Pressable>

                        {showRegionDropdown && (
                            <View
                                style={{
                                    backgroundColor: '#0A1A3A',
                                    borderRadius: 8,
                                    marginTop: 8,
                                    maxHeight: 250,
                                    borderWidth: 1,
                                    borderColor: '#1E293B',
                                }}
                            >
                                {loadingRegions ? (
                                    <View style={{ padding: 20, alignItems: 'center' }}>
                                        <ActivityIndicator size="small" color="#22D3EE" />
                                    </View>
                                ) : (
                                    <>
                                        <TextInput
                                            placeholder="Search region..."
                                            placeholderTextColor="#666"
                                            value={regionSearch}
                                            onChangeText={setRegionSearch}
                                            style={{
                                                color: '#fff',
                                                fontSize: 14,
                                                padding: 12,
                                                borderBottomWidth: 1,
                                                borderBottomColor: '#1E293B',
                                            }}
                                        />
                                        <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 200 }}>
                                            {filteredRegions.length > 0 ? (
                                                filteredRegions.map((region) => (
                                                    <DropdownItem
                                                        key={region.code}
                                                        item={region}
                                                        isSelected={selectedRegion?.code === region.code}
                                                        onPress={() => {
                                                            setSelectedRegion(region);
                                                            setShowRegionDropdown(false);
                                                            setRegionSearch('');
                                                        }}
                                                    />
                                                ))
                                            ) : (
                                                <Text style={{ color: '#9BB3D6', textAlign: 'center', paddingVertical: 20 }}>
                                                    No regions found
                                                </Text>
                                            )}
                                        </ScrollView>
                                    </>
                                )}
                            </View>
                        )}
                    </View>

                    {/* ===== CITY / MUNICIPALITY ===== */}
                    <View style={{ marginBottom: 20 }}>
                        <Text style={{ color: '#CBD5E1', fontSize: 12, marginBottom: 8, fontWeight: '500' }}>
                            City / Municipality <Text style={{ color: '#EF4444' }}>*</Text>
                        </Text>
                        <Pressable
                            onPress={() => {
                                if (selectedRegion) {
                                    setShowCityDropdown(!showCityDropdown);
                                }
                            }}
                            disabled={!selectedRegion}
                            style={{
                                backgroundColor: '#0A1A3A',
                                borderRadius: 11,
                                paddingHorizontal: 15,
                                paddingVertical: 12,
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: selectedCity ? '#22D3EE' : !selectedRegion ? '#555' : '#1E293B',
                                opacity: !selectedRegion ? 0.5 : 1,
                            }}
                        >
                            <Text
                                style={{
                                    color: selectedCity ? '#22D3EE' : !selectedRegion ? '#666' : '#9BB3D6',
                                    fontSize: 14,
                                }}
                            >
                                {selectedCity?.name || (!selectedRegion ? 'Select region first' : 'Select City')}
                            </Text>
                            <Ionicons
                                name={showCityDropdown ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color={!selectedRegion ? '#666' : '#22D3EE'}
                            />
                        </Pressable>

                        {showCityDropdown && selectedRegion && (
                            <View
                                style={{
                                    backgroundColor: '#0A1A3A',
                                    borderRadius: 8,
                                    marginTop: 8,
                                    maxHeight: 250,
                                    borderWidth: 1,
                                    borderColor: '#1E293B',
                                }}
                            >
                                {loadingCities ? (
                                    <View style={{ padding: 20, alignItems: 'center' }}>
                                        <ActivityIndicator size="small" color="#22D3EE" />
                                    </View>
                                ) : (
                                    <>
                                        <TextInput
                                            placeholder="Search city..."
                                            placeholderTextColor="#666"
                                            value={citySearch}
                                            onChangeText={setCitySearch}
                                            style={{
                                                color: '#fff',
                                                fontSize: 14,
                                                padding: 12,
                                                borderBottomWidth: 1,
                                                borderBottomColor: '#1E293B',
                                            }}
                                        />
                                        <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 200 }}>
                                            {filteredCities.length > 0 ? (
                                                filteredCities.map((city) => (
                                                    <DropdownItem
                                                        key={city.code}
                                                        item={city}
                                                        isSelected={selectedCity?.code === city.code}
                                                        onPress={() => {
                                                            setSelectedCity(city);
                                                            setShowCityDropdown(false);
                                                            setCitySearch('');
                                                        }}
                                                    />
                                                ))
                                            ) : (
                                                <Text style={{ color: '#9BB3D6', textAlign: 'center', paddingVertical: 20 }}>
                                                    No cities found
                                                </Text>
                                            )}
                                        </ScrollView>
                                    </>
                                )}
                            </View>
                        )}
                    </View>

                    {/* ===== BARANGAY ===== */}
                    <View style={{ marginBottom: 20 }}>
                        <Text style={{ color: '#CBD5E1', fontSize: 12, marginBottom: 8, fontWeight: '500' }}>
                            Barangay <Text style={{ color: '#EF4444' }}>*</Text>
                        </Text>
                        <Pressable
                            onPress={() => {
                                if (selectedCity) {
                                    setShowBarangayDropdown(!showBarangayDropdown);
                                }
                            }}
                            disabled={!selectedCity}
                            style={{
                                backgroundColor: '#0A1A3A',
                                borderRadius: 11,
                                paddingHorizontal: 15,
                                paddingVertical: 12,
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: selectedBarangay ? '#22D3EE' : !selectedCity ? '#555' : '#1E293B',
                                opacity: !selectedCity ? 0.5 : 1,
                            }}
                        >
                            <Text
                                style={{
                                    color: selectedBarangay ? '#22D3EE' : !selectedCity ? '#666' : '#9BB3D6',
                                    fontSize: 14,
                                }}
                            >
                                {selectedBarangay?.name ||
                                    (!selectedCity ? 'Select city first' : 'Select Barangay')}
                            </Text>
                            <Ionicons
                                name={showBarangayDropdown ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color={!selectedCity ? '#666' : '#22D3EE'}
                            />
                        </Pressable>

                        {showBarangayDropdown && selectedCity && (
                            <View
                                style={{
                                    backgroundColor: '#0A1A3A',
                                    borderRadius: 8,
                                    marginTop: 8,
                                    maxHeight: 250,
                                    borderWidth: 1,
                                    borderColor: '#1E293B',
                                }}
                            >
                                {loadingBarangays ? (
                                    <View style={{ padding: 20, alignItems: 'center' }}>
                                        <ActivityIndicator size="small" color="#22D3EE" />
                                    </View>
                                ) : (
                                    <>
                                        <TextInput
                                            placeholder="Search barangay..."
                                            placeholderTextColor="#666"
                                            value={barangaySearch}
                                            onChangeText={setBarangaySearch}
                                            style={{
                                                color: '#fff',
                                                fontSize: 14,
                                                padding: 12,
                                                borderBottomWidth: 1,
                                                borderBottomColor: '#1E293B',
                                            }}
                                        />
                                        <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 200 }}>
                                            {filteredBarangays.length > 0 ? (
                                                filteredBarangays.map((barangay) => (
                                                    <DropdownItem
                                                        key={barangay.code}
                                                        item={barangay}
                                                        isSelected={selectedBarangay?.code === barangay.code}
                                                        onPress={() => {
                                                            setSelectedBarangay(barangay);
                                                            setShowBarangayDropdown(false);
                                                            setBarangaySearch('');
                                                        }}
                                                    />
                                                ))
                                            ) : (
                                                <Text style={{ color: '#9BB3D6', textAlign: 'center', paddingVertical: 20 }}>
                                                    No barangays found
                                                </Text>
                                            )}
                                        </ScrollView>
                                    </>
                                )}
                            </View>
                        )}
                    </View>

                    {/* ===== STREET ADDRESS ===== */}
                    <View style={{ marginBottom: 20 }}>
                        <Text style={{ color: '#CBD5E1', fontSize: 12, marginBottom: 8, fontWeight: '500' }}>
                            Street Address (Optional)
                        </Text>
                        <TextInput
                            placeholder="e.g. 123 Main Street, Apt 4B"
                            placeholderTextColor="#666"
                            value={streetAddress}
                            onChangeText={setStreetAddress}
                            style={{
                                backgroundColor: '#0A1A3A',
                                borderRadius: 11,
                                color: '#fff',
                                fontSize: 14,
                                paddingHorizontal: 15,
                                paddingVertical: 12,
                                borderWidth: 1,
                                borderColor: '#1E293B',
                            }}
                        />
                    </View>

                    {/* ===== POSTAL CODE ===== */}
                    <View style={{ marginBottom: 30 }}>
                        <Text style={{ color: '#CBD5E1', fontSize: 12, marginBottom: 8, fontWeight: '500' }}>
                            Zip/Postal Code <Text style={{ color: '#EF4444' }}>*</Text>
                        </Text>
                        
                        {loadingPostalCodes && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                <ActivityIndicator size="small" color="#22D3EE" />
                                <Text style={{ color: '#9BB3D6', fontSize: 12, marginLeft: 8 }}>
                                    Loading postal codes...
                                </Text>
                            </View>
                        )}
                        
                        {validPostalCodes.length > 0 && !loadingPostalCodes && (
                            <Text style={{ color: '#22D3EE', fontSize: 11, marginBottom: 8 }}>
                                Valid code(s) for {selectedCity?.name}: {validPostalCodes.join(', ')}
                            </Text>
                        )}
                        
                        <TextInput
                            placeholder="e.g. 1234"
                            placeholderTextColor="#666"
                            value={postalCode}
                            onChangeText={setPostalCode}
                            keyboardType="number-pad"
                            maxLength={4}
                            editable={!!selectedCity}
                            style={{
                                backgroundColor: '#0A1A3A',
                                borderRadius: 11,
                                color: '#fff',
                                fontSize: 14,
                                paddingHorizontal: 15,
                                paddingVertical: 12,
                                borderWidth: 1,
                                borderColor: postalCodeError ? '#EF4444' : postalCode && !postalCodeError ? '#22D3EE' : '#1E293B',
                                opacity: selectedCity ? 1 : 0.5,
                            }}
                        />
                        
                        {postalCodeError && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                                <Text style={{ color: '#EF4444', fontSize: 12, marginLeft: 6, flex: 1 }}>
                                    {postalCodeError}
                                </Text>
                            </View>
                        )}
                        
                        {postalCode && !postalCodeError && postalCode.length === 4 && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                                <Ionicons name="checkmark-circle" size={16} color="#22D3EE" />
                                <Text style={{ color: '#22D3EE', fontSize: 12, marginLeft: 6 }}>
                                    Valid postal code
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* ===== BUTTONS ===== */}
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 30 }}>
                        <Pressable
                            onPress={handleClose}
                            style={({ pressed }) => ({
                                flex: 1,
                                backgroundColor: pressed ? '#475569' : '#334155',
                                paddingVertical: 14,
                                borderRadius: 11,
                                alignItems: 'center',
                            })}
                        >
                            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            onPress={handleSaveAddress}
                            disabled={isSaveDisabled}
                            style={({ pressed }) => ({
                                flex: 1,
                                backgroundColor: isSaveDisabled
                                    ? '#555'
                                    : pressed
                                        ? '#06A8D4'
                                        : '#22D3EE',
                                paddingVertical: 14,
                                borderRadius: 11,
                                alignItems: 'center',
                                opacity: isSaveDisabled ? 0.5 : 1,
                            })}
                        >
                            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                                Save Address
                            </Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
}