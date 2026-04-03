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
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions, BarcodeScanningResult } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useProductAnalysis } from "../hooks/useProductAnalysis";
import { useProductStore } from "../stores/useProductStore";
import { lookupBarcode } from "../services/openFoodFacts";
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

  const scannedProducts = useProductStore((s) => s.scannedProducts);
  const addProduct = useProductStore((s) => s.addProduct);
  const removeProduct = useProductStore((s) => s.removeProduct);
  const isAnalyzing = useProductStore((s) => s.isAnalyzing);

  const canCompare = scannedProducts.length >= 2;

  async function handleBarcodeScan(result: BarcodeScanningResult) {
    const barcode = result.data;

    // Prevent duplicate scans
    if (scannedBarcodesRef.current.has(barcode) || isLooking) return;
    scannedBarcodesRef.current.add(barcode);

    setIsScanning(false);
    setIsLooking(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const lookupResult = await lookupBarcode(barcode);

      if (!lookupResult.found) {
        Alert.alert(
          "Producto no encontrado",
          `No se encontro el producto con codigo ${barcode} en la base de datos. Intenta con otro producto.`,
          [{ text: "OK", onPress: () => { setIsScanning(true); setIsLooking(false); } }]
        );
        scannedBarcodesRef.current.delete(barcode);
        return;
      }

      const product: ScannedProduct = {
        id: generateId(),
        barcode,
        name: lookupResult.name,
        brand: lookupResult.brand,
        imageUrl: lookupResult.imageUrl,
        nutritionalInfo: lookupResult.nutritionalInfo,
        timestamp: Date.now(),
      };

      addProduct(product);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("[SanIA] Lookup error:", error);
      Alert.alert("Error", "No se pudo buscar el producto. Verifica tu conexion a internet.");
      scannedBarcodesRef.current.delete(barcode);
    } finally {
      setIsLooking(false);
      setIsScanning(true);
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

  function handleRemove(id: string) {
    const product = scannedProducts.find((p) => p.id === id);
    if (product) scannedBarcodesRef.current.delete(product.barcode);
    removeProduct(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  // Permission not granted
  if (!permission?.granted) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.permissionView}>
          <Ionicons name="camera-outline" size={64} color="#6366F1" />
          <Text style={s.permissionTitle}>Acceso a la camara</Text>
          <Text style={s.permissionText}>
            SanIA necesita tu camara para escanear codigos de barras de los productos.
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
        {/* Camera viewfinder */}
        <View style={s.cameraWrap}>
          <CameraView
            style={s.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39"],
            }}
            onBarcodeScanned={isScanning ? handleBarcodeScan : undefined}
          />
          {/* Overlay */}
          <View style={s.overlay}>
            <View style={s.scanFrame} />
            <Text style={s.scanHint}>
              {isLooking ? "Buscando producto..." : "Apunta al codigo de barras"}
            </Text>
            {isLooking && <ActivityIndicator size="large" color="#fff" style={{ marginTop: 12 }} />}
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

        {/* Compare button */}
        <View style={s.compareWrap}>
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
  listSection: { borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingTop: 12, paddingBottom: 8 },
  listLabel: { fontSize: 11, fontWeight: "600", color: "#64748B", paddingHorizontal: 16, marginBottom: 8, letterSpacing: 1 },
  productItem: { width: 100, marginRight: 12, alignItems: "center", position: "relative" },
  productImage: { width: 80, height: 80, borderRadius: 12 },
  productPlaceholder: { backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  productName: { fontSize: 11, color: "#0F172A", marginTop: 4, textAlign: "center" },
  removeBtn: { position: "absolute", top: -4, right: 4, width: 24, height: 24, backgroundColor: "#EF4444", borderRadius: 12, alignItems: "center", justifyContent: "center" },
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
});
