import numpy as np
from sklearn.cluster import AffinityPropagation
from sklearn.preprocessing import StandardScaler
from typing import List, Dict, Any
import base64
import io
from PIL import Image
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
from matplotlib.colors import ListedColormap


class ClusteringService:
    """
    Service for performing Affinity Propagation clustering
    Based on clustering.py logic
    """

    def __init__(self):
        """Initialize clustering parameters"""
        # 6-class color map (from clustering.py)
        self.colors_6class = ['#C1292E', '#FCAA67', '#92977E', '#E6E18F', '#16C172', '#89FC00']
        self.colormap_6class = ListedColormap(self.colors_6class)

    def stack_and_preprocess(self, ndvi_arrays: List[np.ndarray]) -> np.ndarray:
        """
        Stack NDVI images from multiple years and prepare for clustering
        Returns: pixels_with_no_none (N x 5 array where N is number of valid pixels)
        """
        # Stack images (5 years)
        stacked_image = np.stack(ndvi_arrays)  # Shape: (5, height, width)

        # Get background/invalid pixels (minimum values)
        min_val = np.min(stacked_image[0])
        pos_to_make_none = np.where(stacked_image[0] == min_val)

        # Remove outliers using IQR method
        mask = np.ones(stacked_image[0].shape, dtype=bool)
        mask[pos_to_make_none] = False

        # Calculate Q1 and Q3 for each year
        Q1_values = [np.nanpercentile(stacked_image[i][mask], 25) for i in range(5)]
        Q3_values = [np.nanpercentile(stacked_image[i][mask], 75) for i in range(5)]

        Q1_avg = np.mean(Q1_values)
        Q3_avg = np.mean(Q3_values)

        outlier_range_min = Q1_avg - 1.5 * (Q3_avg - Q1_avg)
        outlier_range_max = Q3_avg + 1.5 * (Q3_avg - Q1_avg)

        mean_of_each_pixel = np.mean(stacked_image, axis=0)

        # Mark outliers as None
        outlier_positions = np.where(
            (mean_of_each_pixel < outlier_range_min) |
            (mean_of_each_pixel > outlier_range_max)
        )

        print(f"Background pixels: {pos_to_make_none[0].shape}")
        print(f"Outliers: {outlier_positions[0].shape}")

        # Create flattened vector of 5-year pixels
        a = stacked_image.shape
        vector_of_5_years = []

        for i in range(a[1]):  # height
            for j in range(a[2]):  # width
                stack_list = [stacked_image[k][i][j] for k in range(a[0])]
                vector_of_5_years.append(stack_list)

        stacked_vector = np.array(vector_of_5_years)

        # Remove None/NaN values
        pixels_with_no_none = []
        temp = ~np.isnan(stacked_vector)

        for i in range(temp.shape[0]):
            if True in temp[i]:
                pixels_with_no_none.append(stacked_vector[i])

        pixels_with_no_none = np.array(pixels_with_no_none)

        print(f"Valid pixels for clustering: {pixels_with_no_none.shape}")

        return pixels_with_no_none, stacked_image.shape[1:], outlier_positions

    def perform_affinity_propagation(
        self,
        data: np.ndarray,
        damping: float = 0.9,
        preference: int = -10
    ) -> np.ndarray:
        """
        Perform Affinity Propagation clustering
        """
        print("Normalizing data...")
        scaler = StandardScaler()
        data_normalized = scaler.fit_transform(data)

        print("Running Affinity Propagation clustering...")
        affinity_propagation = AffinityPropagation(
            damping=damping,
            preference=preference,
            random_state=42
        )
        affinity_propagation.fit(data_normalized)

        labels = affinity_propagation.labels_
        print(f"Total number of clusters: {np.max(labels) + 1}")

        return labels

    def calculate_threshold_and_map_to_classes(
        self,
        labels: np.ndarray,
        data: np.ndarray
    ) -> tuple:
        """
        Calculate mean threshold and map clusters to 6 classes
        Based on temporal analysis (how many years show high vs low values)
        """
        # Group pixels by cluster
        cluster_values = {}
        for label in set(labels):
            cluster_values[label] = data[labels == label]

        # Calculate mean for each cluster
        cluster_means = []
        for label in sorted(cluster_values.keys()):
            mean_val = np.mean([np.mean(pixel) for pixel in cluster_values[label]])
            cluster_means.append(mean_val)

        # Calculate global threshold (average of all cluster means)
        threshold = np.mean(cluster_means)
        print(f"Calculated threshold: {threshold:.3f}")

        # Sort clusters by mean value
        sorted_indices = np.argsort(cluster_means)

        # Map old labels to sorted labels
        label_mapper = {old_label: new_label for new_label, old_label in enumerate(sorted_indices)}

        # For each pixel, count how many years exceed threshold
        # This creates the 6-class classification:
        # Class 1: 0 years above threshold (poorest)
        # Class 2: 1 year above threshold
        # Class 3: 2 years above threshold
        # Class 4: 3 years above threshold
        # Class 5: 4 years above threshold
        # Class 6: 5 years above threshold (best)

        six_class_labels = []
        for pixel in data:
            years_above_threshold = sum(1 for value in pixel if value >= threshold)
            six_class_labels.append(years_above_threshold + 1)  # Classes 1-6

        return np.array(six_class_labels), threshold, label_mapper

    def create_classification_map(
        self,
        labels: np.ndarray,
        shape: tuple,
        outlier_positions: tuple
    ) -> np.ndarray:
        """
        Create 2D classification map from 1D labels
        """
        # Create base map
        classification_map = np.ones(shape)

        # Fill in labels
        valid_pixel_idx = 0
        for i in range(shape[0]):
            for j in range(shape[1]):
                if valid_pixel_idx < len(labels):
                    classification_map[i, j] = labels[valid_pixel_idx]
                    valid_pixel_idx += 1

        # Mark outliers as NaN
        classification_map[outlier_positions] = np.nan

        return classification_map

    def map_to_image_base64(self, classification_map: np.ndarray) -> str:
        """
        Convert classification map to base64 encoded PNG image
        Reduced size for better performance
        """
        plt.figure(figsize=(6, 6))
        plt.axis('off')
        plt.imshow(classification_map, cmap=self.colormap_6class, vmin=1, vmax=6)
        plt.grid(False)

        # Save to bytes buffer with reduced DPI for smaller file size
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight', pad_inches=0, dpi=100)
        plt.close()

        buf.seek(0)
        img_base64 = base64.b64encode(buf.read()).decode('utf-8')

        return f"data:image/png;base64,{img_base64}"

    def calculate_classification_percentages(
        self,
        labels: np.ndarray
    ) -> Dict[str, float]:
        """
        Calculate percentage of pixels in each of the 6 classes
        """
        total_pixels = len(labels)
        class_counts = {i: np.sum(labels == i) for i in range(1, 7)}

        percentages = {
            f"class_{i}": round((class_counts.get(i, 0) / total_pixels) * 100, 2)
            for i in range(1, 7)
        }

        return percentages

    def calculate_profitability_score(
        self,
        classification_percentages: Dict[str, float]
    ) -> int:
        """
        Calculate overall profitability score (0-100)
        Weighted average where higher classes contribute more
        """
        weights = {1: 10, 2: 30, 3: 50, 4: 70, 5: 85, 6: 100}

        score = sum(
            classification_percentages[f"class_{i}"] * weights[i] / 100
            for i in range(1, 7)
        )

        return int(score)

    async def perform_clustering(
        self,
        ndvi_arrays: List[np.ndarray],
        metadata: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Main method to perform clustering and generate 6-class map
        """
        print("\n=== Starting Clustering Analysis ===")

        # Step 1: Stack and preprocess
        pixels, shape, outlier_positions = self.stack_and_preprocess(ndvi_arrays)

        # Step 2: Perform Affinity Propagation
        cluster_labels = self.perform_affinity_propagation(pixels)

        # Step 3: Map to 6 classes based on temporal analysis
        six_class_labels, threshold, label_mapper = self.calculate_threshold_and_map_to_classes(
            cluster_labels,
            pixels
        )

        # Step 4: Create 2D classification map
        classification_map = self.create_classification_map(
            six_class_labels,
            shape,
            outlier_positions
        )

        # Step 5: Calculate percentages
        percentages = self.calculate_classification_percentages(six_class_labels)

        # Step 6: Calculate profitability score
        profitability_score = self.calculate_profitability_score(percentages)

        # Step 7: Generate map image
        map_base64 = self.map_to_image_base64(classification_map)

        print(f"\nClassification percentages: {percentages}")
        print(f"Profitability score: {profitability_score}")
        print("=== Clustering Analysis Complete ===\n")

        return {
            'classification_percentages': percentages,
            'map_base64': map_base64,
            'profitability_score': profitability_score,
            'threshold': float(threshold),
            'num_clusters': int(np.max(cluster_labels) + 1),
            'classification_map': classification_map.tolist()  # For storage
        }
