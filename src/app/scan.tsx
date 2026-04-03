import { useState, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  Image,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions, BarcodeScanningResult } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useProductAnalysis } from "../hooks/useProductAnalysis";
import { useProductStore } from "../stores/useProductStore";
import { lookupBarcode, searchProducts, SearchResult } from "../services/openFoodFacts";
import { extractProductName } from "../services/ocr";
import type { ScannedProduct } from "../types/product";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

export default function ScanScreen() {
  const router = useRouter();
  const analysis = useProductAnalysis();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(true);
  const [isLooking, setIsLooking] = useState(false);
  const scannedBarcodesRef = useRef<Set<string>>(new Set());
  const scanCountRef = useRef<Record<string, number>>({});
  const REQUIRED_READS = 5;

  // Search modal state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingFromSearch, setIsAddingFromSearch] = useState(false);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | undefined>();

  // Manual entry modal state
  const [showManual, setShowManual] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualBrand, setManualBrand] = useState("");
  const [manualIngredients, setManualIngredients] = useState("");

  const scannedProducts = useProductStore((s) => s.scannedProducts);
  const addProduct = useProductStore((s) => s.addProduct);
  const removeProduct = useProductStore((s) => s.removeProduct);
  const isAnalyzing = useProductStore((s) => s.isAnalyzing);

  const canCompare = scannedProducts.length >= 2;

  async function handleBarcodeScan(result: BarcodeScanningResult) {
    const barcode = result.data;
    if (scannedBarcodesRef.current.has(barcode) || isLooking) return;

    scanCountRef.current[barcode] = (scanCountRef.current[barcode] || 0) + 1;
    if (scanCountRef.current[barcode] < REQUIRED_READS) return;

    scanCountRef.current = {};
    scannedBarcodesRef.current.add(barcode);
    setIsScanning(false);
    setIsLooking(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const lookupResult = await lookupBarcode(barcode);

      if (!lookupResult.found) {
        Alert.alert(
          "Producto no encontrado",
          `Codigo ${barcode} no esta en la base de datos.`,
          [
            { text: "Buscar por nombre", onPress: () => { openSearch(); } },
            { text: "Reintentar", onPress: () => {} },
          ]
        );
        scannedBarcodesRef.current.delete(barcode);
        setIsScanning(true);
        setIsLooking(false);
        return;
      }

      addProductFromLookup(barcode, lookupResult);
    } catch (error) {
      console.error("[SanIA] Lookup error:", error);
      Alert.alert(
        "Error de conexion",
        "No se pudo buscar el producto.",
        [
          { text: "Buscar por nombre", onPress: () => { openSearch(); } },
          { text: "Reintentar", onPress: () => {} },
        ]
      );
      scannedBarcodesRef.current.delete(barcode);
    } finally {
      setIsLooking(false);
      setIsScanning(true);
    }
  }

  function addProductFromLookup(barcode: string, lookupResult: { name: string; brand: string; imageUrl?: string; nutritionalInfo: ScannedProduct["nutritionalInfo"] }, photoUri?: string) {
    const product: ScannedProduct = {
      id: generateId(),
      barcode,
      name: lookupResult.name,
      brand: lookupResult.brand,
      imageUri: photoUri,
      imageUrl: lookupResult.imageUrl,
      nutritionalInfo: lookupResult.nutritionalInfo,
      timestamp: Date.now(),
    };
    addProduct(product);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function openSearch(photoUri?: string) {
    setIsScanning(false);
    setSearchQuery("");
    setSearchResults([]);
    setCapturedPhotoUri(photoUri);
    setShowSearch(true);
  }

  async function handleTakePhoto() {
    let photoUri: string | undefined;

    // Step 1: Take photo
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.7,
        allowsEditing: false,
      });
      if (result.canceled || !result.assets[0]) return;
      photoUri = result.assets[0].uri;
    } catch (e) {
      console.error("[SanIA] Camera error:", e);
      Alert.alert("Error", "No se pudo abrir la camara.");
      return;
    }

    // Step 2: Open search with photo
    setCapturedPhotoUri(photoUri);
    setShowSearch(true);
    setIsScanning(false);
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(true);

    // Step 3: Try to auto-detect product name
    try {
      const detectedName = await extractProductName(photoUri);
      console.log("[SanIA] Detected name:", detectedName);

      if (detectedName.length >= 2) {
        setSearchQuery(detectedName);
        try {
          const results = await searchProducts(detectedName);
          setSearchResults(results);
        } catch {
          // Search failed, user can retry manually
        }
      }
    } catch (e) {
      console.log("[SanIA] OCR failed, user will search manually:", e);
    }

    setIsSearching(false);
  }

  function closeSearch() {
    setShowSearch(false);
    setIsScanning(true);
  }

  function openManualEntry() {
    setShowSearch(false);
    setManualName(searchQuery || "");
    setManualBrand("");
    setManualIngredients("");
    setShowManual(true);
  }

  function closeManual() {
    setShowManual(false);
    setIsScanning(true);
  }

  function handleAddManual() {
    const name = manualName.trim();
    if (!name) {
      Alert.alert("Nombre requerido", "Escribe el nombre del producto.");
      return;
    }
    const ingredientsList = manualIngredients
      .split(",")
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    if (ingredientsList.length === 0) {
      Alert.alert("Ingredientes requeridos", "Escribe los ingredientes separados por coma. Los encuentras en el envase del producto.");
      return;
    }

    const emptyNutrients = {
      calories: 0, totalFat: 0, saturatedFat: 0, transFat: 0,
      sodium: 0, totalCarbs: 0, sugars: 0, addedSugars: 0, fiber: 0, protein: 0,
    };

    const product: ScannedProduct = {
      id: generateId(),
      barcode: "manual-" + Date.now(),
      name,
      brand: manualBrand.trim() || "Marca no especificada",
      imageUri: capturedPhotoUri,
      nutritionalInfo: {
        productName: name,
        brand: manualBrand.trim() || "Marca no especificada",
        servingSize: "No especificado",
        ...emptyNutrients,
        perServing: emptyNutrients,
        ingredients: ingredientsList,
        additives: [],
      },
      timestamp: Date.now(),
    };

    addProduct(product);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    closeManual();
  }

  async function handleSearch() {
    if (searchQuery.trim().length < 2) return;
    setIsSearching(true);
    try {
      const results = await searchProducts(searchQuery.trim());
      setSearchResults(results);
      if (results.length === 0) {
        Alert.alert("Sin resultados", "No se encontraron productos. Intenta con otro nombre.");
      }
    } catch {
      Alert.alert("Error", "No se pudo buscar. Verifica tu conexion.");
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSelectSearchResult(item: SearchResult) {
    if (scannedBarcodesRef.current.has(item.barcode)) {
      Alert.alert("Duplicado", "Este producto ya esta en la lista.");
      return;
    }

    setIsAddingFromSearch(true);
    try {
      const lookupResult = await lookupBarcode(item.barcode);
      if (lookupResult.found) {
        scannedBarcodesRef.current.add(item.barcode);
        addProductFromLookup(item.barcode, lookupResult, capturedPhotoUri);
        closeSearch();
      } else {
        Alert.alert("Error", "No se pudo obtener la informacion nutricional de este producto.");
      }
    } catch {
      Alert.alert("Error", "No se pudo obtener el producto.");
    } finally {
      setIsAddingFromSearch(false);
    }
  }

  function handleCompare() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    analysis.mutate(undefined, {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.push("/results");
      },
      onError: (error) => {
        console.error("[SanIA] Analysis error:", error);
        Alert.alert("Error", "No se pudieron analizar los productos.");
      },
    });
  }

  function handleClearAll() {
    scannedBarcodesRef.current.clear();
    scanCountRef.current = {};
    useProductStore.getState().reset();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }

  function handleRemove(id: string) {
    const product = scannedProducts.find((p) => p.id === id);
    if (product) scannedBarcodesRef.current.delete(product.barcode);
    removeProduct(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  // Permission screen
  if (!permission?.granted) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.permissionView}>
          <Ionicons name="camera-outline" size={64} color="#6366F1" />
          <Text style={s.permissionTitle}>Acceso a la camara</Text>
          <Text style={s.permissionText}>
            SanIA necesita tu camara para escanear codigos de barras.
          </Text>
          <Pressable style={s.permissionBtn} onPress={requestPermission}>
            <Text style={s.permissionBtnText}>Permitir Camara</Text>
          </Pressable>
          <Pressable style={s.backLink} onPress={() => router.back()}>
            <Text style={s.backLinkText}>Volver</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  function renderProduct({ item }: { item: ScannedProduct }) {
    const imgSource = item.imageUrl ? { uri: item.imageUrl } : item.imageUri ? { uri: item.imageUri } : null;
    return (
      <View style={s.productItem}>
        {imgSource ? (
          <Image source={imgSource} style={s.productImage} />
        ) : (
          <View style={[s.productImage, s.productPlaceholder]}>
            <Ionicons name="cube-outline" size={24} color="#94A3B8" />
          </View>
        )}
        <Text style={s.productName} numberOfLines={2}>{item.name}</Text>
        <Pressable style={s.removeBtn} onPress={() => handleRemove(item.id)}>
          <Ionicons name="close" size={14} color="white" />
        </Pressable>
      </View>
    );
  }

  function renderSearchResult({ item }: { item: SearchResult }) {
    return (
      <Pressable
        style={s.searchResultItem}
        onPress={() => handleSelectSearchResult(item)}
        disabled={isAddingFromSearch}
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={s.searchResultImage} />
        ) : (
          <View style={[s.searchResultImage, s.productPlaceholder]}>
            <Ionicons name="cube-outline" size={20} color="#94A3B8" />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={s.searchResultName} numberOfLines={2}>{item.name}</Text>
          {item.brand ? <Text style={s.searchResultBrand}>{item.brand}</Text> : null}
        </View>
        <Ionicons name="add-circle" size={28} color="#6366F1" />
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </Pressable>
        <Text style={s.headerTitle}>Escanear Productos</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ flex: 1 }}>
        {/* Camera */}
        <View style={s.cameraWrap}>
          <CameraView
            style={s.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39"],
            }}
            onBarcodeScanned={isScanning && !showSearch ? handleBarcodeScan : undefined}
          />
          <View style={s.overlay}>
            <View style={s.scanFrame} />
            <Text style={s.scanHint}>
              {isLooking ? "Buscando producto..." : "Apunta al codigo de barras"}
            </Text>
            {isLooking && <ActivityIndicator size="large" color="#fff" style={{ marginTop: 12 }} />}

            {/* Floating action buttons */}
            <View style={s.fabRow}>
              <Pressable style={s.fab} onPress={handleTakePhoto}>
                <Ionicons name="camera" size={22} color="#fff" />
                <Text style={s.fabText}>Foto</Text>
              </Pressable>
              <Pressable style={s.fab} onPress={() => openSearch()}>
                <Ionicons name="search" size={22} color="#fff" />
                <Text style={s.fabText}>Buscar</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Scanned products */}
        {scannedProducts.length > 0 && (
          <View style={s.listSection}>
            <Text style={s.listLabel}>
              {scannedProducts.length} PRODUCTO{scannedProducts.length !== 1 ? "S" : ""} ESCANEADO{scannedProducts.length !== 1 ? "S" : ""}
            </Text>
            <FlatList
              data={scannedProducts}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            />
          </View>
        )}

        {/* Buttons */}
        <View style={s.compareWrap}>
          {scannedProducts.length > 0 && (
            <Pressable style={s.clearBtn} onPress={handleClearAll}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
              <Text style={s.clearBtnText}>Borrar todo</Text>
            </Pressable>
          )}
          <Pressable
            style={[s.compareBtn, canCompare && !isAnalyzing ? s.compareBtnActive : s.compareBtnDisabled]}
            onPress={handleCompare}
            disabled={!canCompare || isAnalyzing}
          >
            {isAnalyzing ? (
              <View style={s.row}>
                <ActivityIndicator size="small" color="#64748B" />
                <Text style={s.compareBtnTextOff}>Analizando...</Text>
              </View>
            ) : (
              <View style={s.row}>
                <Ionicons name="trophy" size={20} color={canCompare ? "white" : "#94A3B8"} />
                <Text style={canCompare ? s.compareBtnTextOn : s.compareBtnTextOff}>
                  Comparar ({scannedProducts.length})
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Search Modal */}
      <Modal visible={showSearch} animationType="slide">
        <SafeAreaView style={s.container}>
          {/* Search header */}
          <View style={s.header}>
            <Pressable onPress={closeSearch} style={{ padding: 8 }}>
              <Ionicons name="close" size={24} color="#0F172A" />
            </Pressable>
            <Text style={s.headerTitle}>Buscar Producto</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Captured photo preview */}
          {capturedPhotoUri && (
            <View style={s.photoPreview}>
              <Image source={{ uri: capturedPhotoUri }} style={s.photoPreviewImg} />
              <Text style={s.photoPreviewText}>Escribe el nombre del producto de la foto</Text>
            </View>
          )}

          {/* Search input */}
          <View style={s.searchInputWrap}>
            <TextInput
              style={s.searchInput}
              placeholder="Nombre del producto..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              autoFocus
              returnKeyType="search"
            />
            <Pressable
              style={[s.searchBtn, searchQuery.trim().length < 2 && { opacity: 0.5 }]}
              onPress={handleSearch}
              disabled={searchQuery.trim().length < 2 || isSearching}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="search" size={20} color="#fff" />
              )}
            </Pressable>
          </View>

          {/* Loading overlay for adding */}
          {isAddingFromSearch && (
            <View style={s.addingOverlay}>
              <ActivityIndicator size="large" color="#6366F1" />
              <Text style={{ color: "#6366F1", marginTop: 8, fontWeight: "600" }}>Agregando producto...</Text>
            </View>
          )}

          {/* Results */}
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.barcode}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}
            ListEmptyComponent={
              !isSearching ? (
                <View style={s.emptySearch}>
                  <Ionicons name="search-outline" size={48} color="#CBD5E1" />
                  <Text style={s.emptySearchText}>
                    {searchQuery.length > 0
                      ? "No se encontraron resultados"
                      : "Escribe el nombre del producto y presiona buscar"}
                  </Text>
                  {searchQuery.length > 0 && (
                    <Pressable style={[s.manualEntryBtn, { marginTop: 20, paddingHorizontal: 24 }]} onPress={openManualEntry}>
                      <Ionicons name="create-outline" size={20} color="#6366F1" />
                      <Text style={s.manualEntryBtnText}>Agregar manualmente</Text>
                    </Pressable>
                  )}
                </View>
              ) : null
            }
            ListFooterComponent={
              searchResults.length > 0 ? (
                <View style={s.notFoundSection}>
                  <View style={s.notFoundDivider} />
                  <Text style={s.notFoundTitle}>¿No encuentras tu producto?</Text>
                  <Text style={s.notFoundSubtitle}>
                    Puedes agregar el mas parecido para comparar
                  </Text>
                  <Pressable
                    style={s.notFoundBtn}
                    onPress={() => handleSelectSearchResult(searchResults[0])}
                    disabled={isAddingFromSearch}
                  >
                    <View style={s.notFoundBtnInner}>
                      {searchResults[0].imageUrl ? (
                        <Image source={{ uri: searchResults[0].imageUrl }} style={s.notFoundBtnImg} />
                      ) : (
                        <View style={[s.notFoundBtnImg, s.productPlaceholder]}>
                          <Ionicons name="cube-outline" size={16} color="#94A3B8" />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={s.notFoundBtnName}>Usar: {searchResults[0].name}</Text>
                        {searchResults[0].brand ? (
                          <Text style={s.notFoundBtnBrand}>{searchResults[0].brand}</Text>
                        ) : null}
                      </View>
                      <Ionicons name="arrow-forward-circle" size={28} color="#6366F1" />
                    </View>
                  </Pressable>
                  <View style={s.notFoundDivider} />
                  <Pressable style={s.manualEntryBtn} onPress={openManualEntry}>
                    <Ionicons name="create-outline" size={20} color="#6366F1" />
                    <Text style={s.manualEntryBtnText}>Agregar manualmente</Text>
                  </Pressable>
                  <Pressable style={s.skipBtn} onPress={closeSearch}>
                    <Text style={s.skipBtnText}>Omitir este producto</Text>
                  </Pressable>
                </View>
              ) : null
            }
          />
        </SafeAreaView>
      </Modal>

      {/* Manual Entry Modal */}
      <Modal visible={showManual} animationType="slide">
        <SafeAreaView style={s.container}>
          <View style={s.header}>
            <Pressable onPress={closeManual} style={{ padding: 8 }}>
              <Ionicons name="close" size={24} color="#0F172A" />
            </Pressable>
            <Text style={s.headerTitle}>Agregar Producto</Text>
            <View style={{ width: 40 }} />
          </View>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
              {/* Photo preview */}
              {capturedPhotoUri && (
                <View style={s.manualPhotoWrap}>
                  <Image source={{ uri: capturedPhotoUri }} style={s.manualPhoto} />
                </View>
              )}

              {/* Info box */}
              <View style={s.manualInfoBox}>
                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                <Text style={s.manualInfoText}>
                  Lee los ingredientes del envase del producto y escribelos separados por coma. SanIA los analizara para determinar que tan procesado es.
                </Text>
              </View>

              {/* Name */}
              <Text style={s.manualLabel}>Nombre del producto *</Text>
              <TextInput
                style={s.manualInput}
                placeholder="Ej: Jugo Watts Naranja"
                placeholderTextColor="#94A3B8"
                value={manualName}
                onChangeText={setManualName}
              />

              {/* Brand */}
              <Text style={s.manualLabel}>Marca</Text>
              <TextInput
                style={s.manualInput}
                placeholder="Ej: Watts"
                placeholderTextColor="#94A3B8"
                value={manualBrand}
                onChangeText={setManualBrand}
              />

              {/* Ingredients */}
              <Text style={s.manualLabel}>Ingredientes (separados por coma) *</Text>
              <TextInput
                style={[s.manualInput, s.manualInputLarge]}
                placeholder="Ej: agua, azucar, concentrado de naranja, colorante, acido citrico"
                placeholderTextColor="#94A3B8"
                value={manualIngredients}
                onChangeText={setManualIngredients}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {/* Add button */}
              <Pressable style={s.manualAddBtn} onPress={handleAddManual}>
                <Ionicons name="add-circle" size={22} color="#fff" />
                <Text style={s.manualAddBtnText}>Agregar Producto</Text>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#0F172A" },
  cameraWrap: { flex: 1, position: "relative", backgroundColor: "#000" },
  camera: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  scanFrame: { width: 260, height: 160, borderWidth: 2, borderColor: "#6366F1", borderRadius: 16, backgroundColor: "transparent" },
  scanHint: { color: "#fff", fontSize: 16, marginTop: 16, fontWeight: "500", textShadowColor: "#000", textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } },
  fabRow: { position: "absolute", bottom: 24, flexDirection: "row", gap: 16 },
  fab: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(99,102,241,0.9)", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, gap: 6 },
  fabText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  listSection: { borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingTop: 12, paddingBottom: 8 },
  listLabel: { fontSize: 11, fontWeight: "600", color: "#64748B", paddingHorizontal: 16, marginBottom: 8, letterSpacing: 1 },
  productItem: { width: 100, marginRight: 12, alignItems: "center", position: "relative" },
  productImage: { width: 80, height: 80, borderRadius: 12 },
  productPlaceholder: { backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  productName: { fontSize: 11, color: "#0F172A", marginTop: 4, textAlign: "center" },
  removeBtn: { position: "absolute", top: -4, right: 4, width: 24, height: 24, backgroundColor: "#EF4444", borderRadius: 12, alignItems: "center", justifyContent: "center" },
  clearBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, marginBottom: 8, borderRadius: 12, borderWidth: 1.5, borderColor: "#EF4444" },
  clearBtnText: { color: "#EF4444", fontWeight: "600", fontSize: 15, marginLeft: 6 },
  compareWrap: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8 },
  compareBtn: { paddingVertical: 16, borderRadius: 16, alignItems: "center" },
  compareBtnActive: { backgroundColor: "#22C55E" },
  compareBtnDisabled: { backgroundColor: "#E2E8F0" },
  compareBtnTextOn: { color: "#fff", fontWeight: "600", fontSize: 16, marginLeft: 8 },
  compareBtnTextOff: { color: "#94A3B8", fontWeight: "600", fontSize: 16, marginLeft: 8 },
  row: { flexDirection: "row", alignItems: "center" },
  permissionView: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  permissionTitle: { fontSize: 22, fontWeight: "bold", color: "#0F172A", marginTop: 24, marginBottom: 8 },
  permissionText: { fontSize: 16, color: "#64748B", textAlign: "center", marginBottom: 24, lineHeight: 24 },
  permissionBtn: { backgroundColor: "#6366F1", paddingVertical: 14, paddingHorizontal: 32, borderRadius: 16 },
  permissionBtnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  backLink: { marginTop: 16 },
  backLinkText: { color: "#6366F1", fontSize: 16 },
  // Search modal
  searchInputWrap: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  searchInput: { flex: 1, backgroundColor: "#F1F5F9", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: "#0F172A" },
  searchBtn: { backgroundColor: "#6366F1", width: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  searchResultItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F1F5F9", gap: 12 },
  searchResultImage: { width: 56, height: 56, borderRadius: 8 },
  searchResultName: { fontSize: 15, fontWeight: "500", color: "#0F172A" },
  searchResultBrand: { fontSize: 13, color: "#64748B", marginTop: 2 },
  emptySearch: { alignItems: "center", paddingTop: 64 },
  emptySearchText: { color: "#94A3B8", fontSize: 15, textAlign: "center", marginTop: 12, paddingHorizontal: 32 },
  addingOverlay: { alignItems: "center", justifyContent: "center", padding: 16 },
  photoPreview: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#F8FAFC", gap: 12 },
  photoPreviewImg: { width: 60, height: 60, borderRadius: 8 },
  photoPreviewText: { flex: 1, color: "#64748B", fontSize: 14 },
  notFoundSection: { paddingTop: 16, paddingBottom: 32 },
  notFoundDivider: { height: 1, backgroundColor: "#E2E8F0", marginBottom: 20 },
  notFoundTitle: { fontSize: 16, fontWeight: "600", color: "#0F172A", textAlign: "center" },
  notFoundSubtitle: { fontSize: 14, color: "#64748B", textAlign: "center", marginTop: 4, marginBottom: 16 },
  notFoundBtn: { backgroundColor: "#F0F0FF", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#C7D2FE" },
  notFoundBtnInner: { flexDirection: "row", alignItems: "center", gap: 10 },
  notFoundBtnImg: { width: 40, height: 40, borderRadius: 8 },
  notFoundBtnName: { fontSize: 14, fontWeight: "500", color: "#0F172A" },
  notFoundBtnBrand: { fontSize: 12, color: "#64748B" },
  manualEntryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: "#6366F1", gap: 8 },
  manualEntryBtnText: { color: "#6366F1", fontWeight: "600", fontSize: 15 },
  skipBtn: { marginTop: 12, alignItems: "center", paddingVertical: 12 },
  skipBtnText: { color: "#94A3B8", fontSize: 14 },
  // Manual entry modal
  manualPhotoWrap: { alignItems: "center", marginBottom: 16 },
  manualPhoto: { width: 120, height: 120, borderRadius: 16 },
  manualInfoBox: { flexDirection: "row", backgroundColor: "#EFF6FF", borderRadius: 12, padding: 14, marginBottom: 20, gap: 10 },
  manualInfoText: { flex: 1, color: "#1E40AF", fontSize: 13, lineHeight: 20 },
  manualLabel: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 6, marginTop: 12 },
  manualInput: { backgroundColor: "#F1F5F9", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: "#0F172A" },
  manualInputLarge: { minHeight: 100, paddingTop: 12 },
  manualAddBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#6366F1", paddingVertical: 16, borderRadius: 16, marginTop: 24, gap: 8 },
  manualAddBtnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
