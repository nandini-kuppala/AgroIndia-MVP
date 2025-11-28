import numpy as np
import time
from images import get_stacked_imgs
from sklearn.cluster import AffinityPropagation
from sklearn.preprocessing import StandardScaler
import pickle
import json
import os


# with open('params.json') as f:
#     params_json = json.load(f)
#     DATASET_NAME = f'{params_json.get('DATASET_NAME')}.pkl'


def Affinity_Propagation(
        dataset_name : str, 
        outlier_type : str, 
        damping = 0.9, 
        preference = -10
    ):

    """ Affinity Propagation clustering 

    returns:
    labels are the cluster labels whicha re assigned to each pixel
    future_req_array is the array of ones (same size as the img) which is required for plotting
    shape_to_reshape is the shape of the image, which is required for reshaping the pixels to image
    pixels_with_no_None is the pixels which are not None (after removing outliers)
    """
    
    pixels_with_no_None, future_req_array, shape_to_reshape, Nan_posn, vals_in_None = get_stacked_imgs(
                                                                                        dataset_name=dataset_name, 
                                                                                        outlier_type=outlier_type
                                                                                    )

    saveload_path = f"labels_{outlier_type}_{dataset_name}.pkl"

    # load data of labels
    if saveload_path in os.listdir('label_data'):
        with open(f'label_data/{saveload_path}','rb') as f:
            labels = pickle.load(f)
            labels = labels.labels_
        print(f'labels data loaded from label_data/{saveload_path}\n')

    else:
        # save data of labels
        scaler = StandardScaler()   #🌟🌟🌟
        data_normalized = scaler.fit_transform(pixels_with_no_None)

        st = time.time()
        affinity_propagation = AffinityPropagation(
                                    damping=damping, 
                                    preference=preference
                               )
        affinity_propagation.fit(data_normalized)

        print(f"Time taken for clustering - {time.time()-st} seconds\n")

        labels = affinity_propagation.labels_

        with open(f'label_data/{saveload_path}','wb') as f:
            pickle.dump(affinity_propagation,f)
            print(f'labels data saved in label_data/{saveload_path}\n')
            
    print(f"Total num of cluster - {np.max(labels)+1}")
    return labels, future_req_array, shape_to_reshape, pixels_with_no_None, Nan_posn, vals_in_None

from matplotlib.colors import ListedColormap
import matplotlib.pyplot as plt

plt.style.use('ggplot')
# plt.style.use('dark_background')
colors = ['#000000', '#4D4D4D', '#999999', '#E6E6E6', '#F21414', '#F54F4F', '#F98A89', '#FCC4C4', '#F78D0F',
          '#F9A94B', '#FBC687', '#FFFF00', '#FFFF3F', '#FFFF80', '#E9C3E1', '#D386C4', '#BE4AA7',
          '#A80F89', '#D4C3E0', '#AA87C1', '#7E4CA1', '#531182', '#C1CCDD', '#839ABB', '#446899', '#093477',
          '#C1D6C1', '#82AD82', '#448444', '#075B06']
coolors = ['#E3170A','#72705B','#05F140','#0B6E4F']
coolors1 = ['#52050A','#05F140']
coolors2 = ['#56351E','#009B72']
coolors3 = ['#C1292E','#FCAA67','#92977E','#E6E18F','#16C172','#89FC00']

coolors4 = ['#753705','#C1292E','#BF0B92', '#FCAA67','#92977E','#E6E18F','#16C172','#89FC00']

col_map = ListedColormap(colors)
cool_map = ListedColormap(coolors)
cool_map1 = ListedColormap(coolors1)
cool_map2 = ListedColormap(coolors2)
cool_map3 = ListedColormap(coolors3)
cool_map4 = ListedColormap(coolors4)

import cv2
import numpy as np
import json

# Load parameters from the JSON file
# with open('params.json') as f:
#     params_json = json.load(f)

with open('dataset_paths.json') as f:
    paths_global = json.load(f)

# OUTLIER_TYPE = params_json.get('OUTLIER_TYPE')             # 'hl' for both high and low, 'h' for high, 'l' for low, '' for none
# DATASET_NAME = params_json.get('DATASET_NAME')            # 'ndvi', 'savi', 'msavi' (along with field no's)                            


# loading and preprocessing images
def open_normlz_and_remove_outliers_4_imgs(
        dataset_name : str, 
        outlier_type : str
    ):
    
    paths = paths_global.get(dataset_name)
    pth1, pth2, pth3, pth4, pth5 = paths[0], paths[1], paths[2], paths[3], paths[4]

    img1 = cv2.imread(pth1,cv2.IMREAD_UNCHANGED)
    img2 = cv2.imread(pth2,cv2.IMREAD_UNCHANGED)
    img3 = cv2.imread(pth3,cv2.IMREAD_UNCHANGED)
    img4 = cv2.imread(pth4,cv2.IMREAD_UNCHANGED)
    img5 = cv2.imread(pth5,cv2.IMREAD_UNCHANGED)    

    img1 = img1 / 10000
    img2 = img2 / 10000
    img3 = img3 / 10000
    img4 = img4 / 10000
    img5 = img5 / 10000

    #MEAN +/- 1.96*SD

    minn = np.min(img1)

    pos_to_make_None = np.where(img1 == minn)   #-3.26 will be removed... In 2020, there is a negative value, -0.144, but that isnt made 0, here  (for ndvi field 2)
    print(f"Bg None pixels -> {pos_to_make_None[0].shape}")

    mask = np.ones(img1.shape, dtype=bool)

    mask[pos_to_make_None] = False

    img1_Q1 = np.nanpercentile(img1[mask], 25)
    img2_Q1 = np.nanpercentile(img2[mask], 25)
    img3_Q1 = np.nanpercentile(img3[mask], 25)
    img4_Q1 = np.nanpercentile(img4[mask], 25)
    img5_Q1 = np.nanpercentile(img5[mask], 25)

    img1_Q3 = np.nanpercentile(img1[mask], 75)
    img2_Q3 = np.nanpercentile(img2[mask], 75)
    img3_Q3 = np.nanpercentile(img3[mask], 75)
    img4_Q3 = np.nanpercentile(img4[mask], 75)
    img5_Q3 = np.nanpercentile(img5[mask], 75)

    Q1_avg = (img1_Q1 + img2_Q1 + img3_Q1 + img4_Q1 + img5_Q1) / 5
    Q3_avg = (img1_Q3 + img2_Q3 + img3_Q3 + img4_Q3 + img5_Q3) / 5

    outlier_range_min = Q1_avg - 1.5 * (Q3_avg - Q1_avg)
    outlier_range_max = Q3_avg + 1.5 * (Q3_avg - Q1_avg)

    mean_of_eachpix_in_Img = (img1 + img2 + img3 + img4 + img5) / 5

    print(f" outlier -> {outlier_type}")

    # ❌❌❌ OUTLIER CONDN Part

    if outlier_type == 'hl':
        pos_to_make_None = np.where((mean_of_eachpix_in_Img < outlier_range_min) | (mean_of_eachpix_in_Img > outlier_range_max))  # | (mean_of_eachpix_in_Img > outlier_range_max)... for only outlier_max, also hav to include the -3.26 coords
    
    elif outlier_type == 'l':
        pos_to_make_None = np.where((mean_of_eachpix_in_Img < outlier_range_min))
    
    elif outlier_type == 'h':
        pos_to_make_None1 = np.where((mean_of_eachpix_in_Img > outlier_range_max))
        pos_to_make_None = np.concatenate((pos_to_make_None[0], pos_to_make_None1[0]),axis=0),np.concatenate((pos_to_make_None[1], pos_to_make_None1[1]),axis=0)   #❌only for outlier_max
    else:
        # condition where no outliers are removed (Except the bg pixels)
        pass

    print(f"Outliers -> {pos_to_make_None[0].shape},\nTotal Pixels -> {mean_of_eachpix_in_Img.shape[0] * mean_of_eachpix_in_Img.shape[1]}")

    return img1, img2, img3, img4, img5, pos_to_make_None


# stack images and few other stuff
def get_stacked_imgs(
        dataset_name : str, 
        outlier_type : str
    ):
    """ opens images, stacks them, removes NAN values , returns pixels at Nan position, and returns one single vector """

    img1, img2, img3, img4, img5, pos_to_make_None = open_normlz_and_remove_outliers_4_imgs(dataset_name=dataset_name, outlier_type=outlier_type)

    future_req_array = np.ones_like(img1)

    future_req_array[pos_to_make_None]=0

    vals_in_None = [
        img1[pos_to_make_None], 
        img2[pos_to_make_None], 
        img3[pos_to_make_None], 
        img4[pos_to_make_None], 
        img5[pos_to_make_None]
    ]
    
    img1[pos_to_make_None] = None
    img2[pos_to_make_None] = None
    img3[pos_to_make_None] = None
    img4[pos_to_make_None] = None
    img5[pos_to_make_None] = None


    stacked_image = np.stack( [img1, img2, img3, img4, img5] )
    vector_of_5_years = []
    a = stacked_image.shape
    
    for i in range(a[1]):
        for j in range(a[2]):
            stack_list = []
            for k in range(a[0]):
                stack_list.append(stacked_image[k][i][j])
            vector_of_5_years.append(stack_list[:])

    stacked_image = np.array(vector_of_5_years)

    pixels_with_no_None = []

    temp = ~np.isnan(stacked_image)
    for i in range(temp.shape[0]):
        if True in temp[i]:
            pixels_with_no_None.append(stacked_image[i])
    pixels_with_no_None = np.array(pixels_with_no_None)

    return pixels_with_no_None, future_req_array, img1.shape, pos_to_make_None, vals_in_None

from clustering import Affinity_Propagation
from mapper_nd_utility_func import cluster_label_year_map, find_mean_var_nd_sort
from mapper_nd_utility_func import map_new_labels_with_old, high_low_using_clustering, assign_classes_to_outliers
from mapper_nd_utility_func import high_low_and_intermediate_without_clustering, LinePLot_X_Intermediate_map
from mapper_nd_utility_func import interested_cluster_plot, pix_count, confusion_matrix
import pickle

# import json
# with open('params.json') as f:
#     params = json.load(f)
#     stat_analyz = params.get('stat_analyze')
#     interested_cluster = params.get('interested_cluster')


def main(
        dataset_name : str, 
        pics_path : str,
        stat_analyz : str = 'mean', 
        outlier_type : str = '', 
        interested_cluster : int | list = None,
        include_outlier_pixels : bool = False
    ):

    # os.makedirs(f'pics/{dataset_name}', exist_ok=True)

    confusion_matrix_store = []

    labels, _, shape_to_reshape, pixels_with_no_None, nan_posn, vals_in_None = Affinity_Propagation(
                                                                                    dataset_name=dataset_name, 
                                                                                    outlier_type=outlier_type
                                                                                )
    print('Clustering done\n')

    cluster_lineplot, cluster_values, pixel_count_plot = cluster_label_year_map(
                                                            labels=labels, 
                                                            data=pixels_with_no_None
                                                        )

    indexes, high_low_pixels_based_on_avg_clusters, threshold = find_mean_var_nd_sort(
                                                                    cluster_values=cluster_values
                                                                )

    final_mapped_op,  inter_clust_val1, _, var_plot_4_each_pix, mapper_4_plotting = map_new_labels_with_old(
                                                                                        cluster_lineplot=cluster_lineplot, 
                                                                                        indexes=indexes, 
                                                                                        interested_cluster=interested_cluster, 
                                                                                        threshold=threshold, 
                                                                                        stat_analyz=stat_analyz
                                                                                    )

    outliers_vals_for_6class_clust, outlier_vals_for_2class_clust = assign_classes_to_outliers(
                                                                        outliers=vals_in_None, 
                                                                        threshold=threshold,
                                                                        include_outlier_pixels=include_outlier_pixels
                                                                    )

    high_low_using_clustering(
        high_low_pixel_vals=high_low_pixels_based_on_avg_clusters, 
        labels=labels, 
        shape_to_reshape=shape_to_reshape, 
        nan_posn=nan_posn, 
        vals_in_None=outlier_vals_for_2class_clust, 
        pics_path=pics_path,
        include_outlier_pixels=include_outlier_pixels
    )

    confusion_matrix_store = high_low_and_intermediate_without_clustering(
                                data=pixels_with_no_None, 
                                shape_to_reshape=shape_to_reshape, 
                                nan_posn=nan_posn, 
                                confusion_matrix_store=confusion_matrix_store, 
                                vals_in_None=vals_in_None, 
                                pics_path=pics_path,
                                include_outlier_pixels=include_outlier_pixels
                            )

    confusion_matrix_store, line_plots_data = LinePLot_X_Intermediate_map(
                                                stat_clust_vals=final_mapped_op, 
                                                inter_clust_val1=inter_clust_val1, 
                                                variance_plot=var_plot_4_each_pix, 
                                                mapper_4_plotting=mapper_4_plotting, 
                                                confusion_matrix_store=confusion_matrix_store,
                                                labels=labels,
                                                shape_to_reshape=shape_to_reshape,
                                                stat_analyz=stat_analyz,
                                                nan_posn=nan_posn,
                                                threshold=threshold,
                                                vals_in_None=outliers_vals_for_6class_clust,
                                                pics_path=pics_path,
                                                include_outlier_pixels=include_outlier_pixels
                                            )

    # if interested_cluster:
    #     interested_cluster_plot(mapper=mapper_4_plotting, labels=labels, shape_to_reshape=shape_to_reshape, nan_posn=nan_posn, interested_cluster=interested_cluster)  

    pix_count(
        pixel_count_plot=pixel_count_plot,
        mapper=mapper_4_plotting, 
        pics_path=pics_path
    )


    data_for_plotting_interested_cluster = {
        'mapper': mapper_4_plotting,
        'labels': labels,
        'shape_to_reshape': shape_to_reshape,
        'nan_posn': nan_posn,
    }
    
    saveload_path = f"{outlier_type}_{dataset_name}.pkl"
    with open(f'data_for_plotting_interested_cluster/{saveload_path}', 'wb') as f:
        pickle.dump(data_for_plotting_interested_cluster, f)

    return confusion_matrix(
            confusion_matrix_store=confusion_matrix_store
        ), line_plots_data, threshold



if __name__ == "__main__":
    main()

from matplotlib.colors import BoundaryNorm
import numpy as np
import matplotlib.pyplot as plt
from get_colors import *
import pandas as pd
import seaborn as sns
import cv2
import warnings
import tifffile

warnings.filterwarnings("ignore")

stat_analyz_type = {
        'mean' : 0,
        'variance' : 1,
        'median' : 2
    }


def plot_image_boxplots(image_paths : list, title : str, name : str):

    pixel_values = []
    labels = []

    for idx, path in enumerate(image_paths):
        # Load image in unchanged format
        img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
        img = img / 10000  # Scale the image
        if img is None:
            print(f"Error: Unable to load image at path: {path}")
            continue

        # Flatten the image array and replace minimum value with NaN
        flat_pixels = img.flatten()
        min_value = np.min(flat_pixels)
        print(f"Minimum value for Image {idx+1}: {min_value}")
        flat_pixels[flat_pixels == min_value] = np.nan

        # Append the pixel values and corresponding labels
        pixel_values.extend(flat_pixels)
        labels.extend([f"{idx+ 2019}"] * len(flat_pixels))

    # Create a DataFrame for Seaborn compatibility
    data = pd.DataFrame({
        "Pixel Intensity": pixel_values,
        "Image": labels
    })

    # Plot using Seaborn
    plt.figure(figsize=(12, 6))
    sns.boxplot(
        x="Image",
        y="Pixel Intensity",
        data=data,
        showfliers=True,
        palette="pastel"
    )
    plt.title(f"Boxplot of {title}")
    plt.xlabel("Years")
    plt.ylabel(f"{name} values")
    plt.grid(axis="y", linestyle="--", alpha=0.7)
    plt.tight_layout()
    plt.show()


def cluster_label_year_map(labels, data):
    """
    seperates pix value based on its years and also counts number of pixels
    for each cluster (with incorrect labels, but its fixd in the pix_count func)  

    returns: cluster_lineplot, cluster, pixel_count_plot
    cluster_lineplot: {cluster_label: {year: [pixel_values]}}
    cluster_values: {cluster_label: [pixel_values]}
    pixel_count_plot: {cluster_label: pixel_count}
    """
    
    cluster_lineplot = {i:{'2019':[],'2020':[],'2021':[],'2022':[],'2023':[]} for i in set(labels)}
    cluster_values = {i:[] for i in set(labels)}

    for i,j in zip(labels,data):
        cluster_lineplot[i]['2019'].append(j[0])
        cluster_lineplot[i]['2020'].append(j[1])
        cluster_lineplot[i]['2021'].append(j[2])
        cluster_lineplot[i]['2022'].append(j[3])
        cluster_lineplot[i]['2023'].append(j[4])
        
        cluster_values[i].append(j)

    count = 0
    pixel_count_plot = {i : 0 for i in cluster_values}

    for i in cluster_values:
        pixel_count_plot[i]  +=  len(cluster_values[i])
        count += len(cluster_values[i])

    print(f"Total pix - {count}")

    return cluster_lineplot, cluster_values, pixel_count_plot


def find_mean_var_nd_sort(cluster_values):
    """ 
    calculates mean and variance and finds the avg of all clusters
    and then sorts the clusters based on the mean value
    returns: indexes, high_low_pixels_based_on_avg_clusters
    indexes: sorted cluster labels
    high_low_pixels_based_on_avg_clusters: 1 for low, 2 for high
    threshold : threshold calculated after clustering and calculating the mean
    """
    mean_nd_variance_values = [0 for _ in cluster_values]

    for i in cluster_values:
        # print(i)   #this for avg_bel, labels
        x = [np.mean(i) for i in cluster_values[i]]
        y = [np.std(i) for i in cluster_values[i]]
        mn = np.mean(x)
        std = np.std(y)
        mean_nd_variance_values[i] = [mn,std]

    mean_arrmean = round(np.mean([i[0] for i in mean_nd_variance_values]), 3)
    print(f"avg of all clusters -> {mean_arrmean}")  #AVG OF ALL GROUPS
    threshold = mean_arrmean          #cluster threshold

    high_low_pixels_based_on_avg_clusters = []

    for i in mean_nd_variance_values:
        high_low_pixels_based_on_avg_clusters.append(1 if i[0] < mean_arrmean else 2)  #nominal data - categories...

    mean_nd_variance_values = np.array(mean_nd_variance_values)
    indexes = np.lexsort((mean_nd_variance_values[:,0],))

    return indexes, high_low_pixels_based_on_avg_clusters, threshold


def Stats_cluster_label_year_map(cluster_vals, num_clust, threshold, stat_analyz : str = 'mean'):
    """ 
     finds mean for each cluster and counts for how many years 
     the mean was low when cmpared with the threshold value given by find_mean_var_nd_sort func
     (clustering included)... (used in intermediate maps)
        returns: stat_clust, intermediate_cluster_vals1, intermediate_cluster_vals2, ig_variance
        stat_clust: {cluster_label: {year: [mean, std, median]}}
        intermediate_cluster_vals1: {cluster_label: number of years low}
        intermediate_cluster_vals2: {cluster_label: {year: 'low'/'high'}}
        ig_variance: {cluster_label: variance}
    """

    selected_stat_analyz = stat_analyz_type[stat_analyz]

    stat_clust = {i : {'2019' : 0, '2020' : 0, '2021' : 0, '2022' : 0, '2023' : 0} for i in range(num_clust)}
    intermediate_cluster_vals1 = {}
    intermediate_cluster_vals2 = {i : {'2019' : 0, '2020' : 0, '2021' : 0, '2022' : 0, '2023' : 0} for i in range(num_clust)}

    variance_vals = {}

    for i in cluster_vals:
        stat_clust[i]['2019'] = [np.mean(cluster_vals[i]['2019']), np.std(cluster_vals[i]['2019']), np.median(cluster_vals[i]['2019'])]
        stat_clust[i]['2020'] = [np.mean(cluster_vals[i]['2020']), np.std(cluster_vals[i]['2020']), np.median(cluster_vals[i]['2020'])]
        stat_clust[i]['2021'] = [np.mean(cluster_vals[i]['2021']), np.std(cluster_vals[i]['2021']), np.median(cluster_vals[i]['2021'])]
        stat_clust[i]['2022'] = [np.mean(cluster_vals[i]['2022']), np.std(cluster_vals[i]['2022']), np.median(cluster_vals[i]['2022'])]
        stat_clust[i]['2023'] = [np.mean(cluster_vals[i]['2023']), np.std(cluster_vals[i]['2023']), np.median(cluster_vals[i]['2023'])]

        counter = 5   #5 years

        for j in stat_clust[i]:
            #clustering intermediate maps
            if stat_clust[i][j][selected_stat_analyz] < threshold: 
                counter -= 1  #if all years low, then 0

                intermediate_cluster_vals2[i][j] = 'low'
            else: 
                intermediate_cluster_vals2[i][j] = 'high'

        intermediate_cluster_vals1[i] = counter + 1     

    return stat_clust, intermediate_cluster_vals1, intermediate_cluster_vals2, variance_vals


def map_new_labels_with_old(cluster_lineplot, indexes, interested_cluster, threshold, stat_analyz : str):
    """ 
    maps old labels with the new ones after sorting the clsuters based on mean, 
    prints interested cluster values and calls Stat_clust_label function
    returns: op1, op2, op3, op4, mapper
    op1: cluster_lineplot
    op2: cluster_values
    op3: pixel_count_plot
    op4: high_low_pixels_based_on_avg_clusters
    mapper: {old_label: new_label}

    """

    mapper = {i : j for i, j in zip(indexes, range(len(indexes)))}
    sorted_cluster_lineplot = {mapper[i] : cluster_lineplot[i] for i in cluster_lineplot}

    if interested_cluster: 
        print(f"interested cluster {interested_cluster} -> {sorted_cluster_lineplot[interested_cluster]}")
    stat_clust, intermediate_cluster_vals1, intermediate_cluster_vals2, variance_vals = Stats_cluster_label_year_map(cluster_vals=sorted_cluster_lineplot, num_clust=np.max(indexes) + 1, threshold=threshold, stat_analyz=stat_analyz)

    return stat_clust, intermediate_cluster_vals1, intermediate_cluster_vals2, variance_vals, mapper

def make_the_map(x, mapper):
    x = x.flatten()
    c = 0
    for j in range(len(x)):
        if x[j]:
            x[j] = mapper[c]
            c += 1
        else:
            x[j] = np.nan
    return x

def save_Table_images(pics_path, name, table):

    df = pd.DataFrame(table)

    fig, ax = plt.subplots(figsize=(6, 4))  # Adjust figure size as needed
    ax.axis('tight')
    ax.axis('off')

    table = ax.table(cellText=df.values, colLabels=df.columns, loc='center', cellLoc='center')
    table.auto_set_font_size(False)
    table.set_fontsize(10)  # Adjust font size
    table.auto_set_column_width(col=list(range(len(df.columns))))  # Adjust column width

    plt.title(f'binary map - Table')
    # Save the table as an image

    output_path = f"{pics_path}/{name}_table.png"  # Change to your desired file path
    plt.savefig(output_path, dpi=300, bbox_inches='tight', pad_inches=0)
    print(f'table saved for {name}')
    plt.close()
    return

def assign_classes_to_outliers(outliers, threshold, include_outlier_pixels : bool = False):
    """
    Assigns classes to outliers based on the threshold calculated
    (either using Clustering or Rule-Based average)
    """

    if not include_outlier_pixels:
        return [], []
    
    # count years for each location where the pixel value is less than the threshold
    def count_years(data, threshold):
        count = 5
        for i in data:
            if i < threshold:
                count -= 1
        return count
    
    print('🌟🌟🌟 inside outlier function')
    
    
    outliers = np.array(outliers)
    min_val = np.min(outliers)

    outliers_vals_for_6class = []
    outliers_vals_for_2class = []

    for idx in range(outliers.shape[1]):
        if min_val in outliers[:, idx]:
            outliers_vals_for_2class.append(np.nan)
            outliers_vals_for_6class.append(np.nan)
            continue
        outliers_vals_for_2class.append(1 if np.mean(outliers[:, idx]) < threshold else 2)
        outliers_vals_for_6class.append(count_years(outliers[:, idx], threshold) + 1)
        
    return outliers_vals_for_6class, outliers_vals_for_2class

def high_low_using_clustering(high_low_pixel_vals, labels, shape_to_reshape, nan_posn, pics_path, vals_in_None, include_outlier_pixels : bool = False):
    """ 
    this one gives high low  based on clusters, plots the intervals 
    (how many high and low for how many years based on average, no clust) 
    along with acres calculation
    """

    mapper = {i : high_low_pixel_vals[i] for i in range(len(high_low_pixel_vals))}    # 'i' was taken in order of labels in cluster variable in find_mean_var_nd_sort()
    new_lb = [mapper[i] for i in labels]

    x = np.ones(shape = shape_to_reshape)

    count_high_low_pixels = {i : new_lb.count(i) + vals_in_None.count(i) for i in [1, 2]}  #counting high low pixels + outlier pixels too

    table = []
    for i in [1, 2]:   #Area, acre counter for high low
        print(f"{i} - Pixel Count - {count_high_low_pixels[i]}, Area - {count_high_low_pixels[i]*900}, Acres - {round(count_high_low_pixels[i]*900/4046.86, 3)}")
        table.append({
            "Label": i, 
            "Num of Pixels": count_high_low_pixels[i], 
            "Area": count_high_low_pixels[i] * 900, 
            "Acres": round(count_high_low_pixels[i] * 900 / 4046.86, 3)
        })
    
    save_Table_images(pics_path=pics_path, table=table, name='high_low_clustering')
    
    x[nan_posn] = 0

    x = make_the_map(x=x, mapper=new_lb)
    
    print('w clust')
    x = np.reshape(x, shape_to_reshape)

    # outlier pixels are included too
    if include_outlier_pixels:
        x[nan_posn] = vals_in_None

    plt.figure(figsize = (10, 10))
    plt.axis('off')
    plt.imshow(x,cmap = cool_map2)
    # cbar  =  plt.colorbar()
    # cbar.set_ticks(np.arange(1, 3, dtype = int))
    # cbar.set_ticklabels(np.arange(1, 3, dtype = int))
    plt.grid(False)

    # Save the plot as a .tif image locally
    output_path = f'{pics_path}/high_low_clustering.tif'  # Specify the output file name
    # plt.savefig(output_path, format='tiff', bbox_inches='tight', pad_inches=0)
    tifffile.imwrite(output_path, x.astype('float32'))  
    # plt.show()
    plt.close()


def high_low_and_intermediate_without_clustering(data, shape_to_reshape, nan_posn, confusion_matrix_store, pics_path, vals_in_None, include_outlier_pixels: bool = False):
    """ 
    high low map, intermediate map map  (without clustering version) 
    """
    x = np.ones(shape = shape_to_reshape)
    x[nan_posn] = 0

    x = x.flatten()
    indxr = 0

    temp = data
    avg_of_each_pix_4_5yrs = []
    for i in range(data.shape[0]):
        avg_of_each_pix_4_5yrs.append(np.mean(temp[i]))
    
    total_mean = round(np.mean(avg_of_each_pix_4_5yrs), 3)
    print(f"high_low_without_clustering threshold-> {total_mean}")

    outlier_vals_for_6class_clust, outlier_vals_for_2class_clust = assign_classes_to_outliers(outliers=vals_in_None, threshold=total_mean, include_outlier_pixels=include_outlier_pixels)

    acre_counter = {i : outlier_vals_for_2class_clust.count(i) for i in [1, 2]}  # including the outlier pixels too

    print(set(outlier_vals_for_2class_clust))

    for j in range(len(x)):
        if x[j]:
            x[j] = 1 if avg_of_each_pix_4_5yrs[indxr] < total_mean else 2
            acre_counter[x[j]] += 1
            indxr += 1
        else:
            x[j] = np.nan
        


    print(f"sum of pixels - {sum(acre_counter.values())}")

    table = []
    for label in [1, 2]:
        print(f"{label} - num of pixels {acre_counter[label]}, Area - {acre_counter[label] * 900}, Acres - {round(acre_counter[label] * 900 / 4046.86, 3)}")
        table.append({
            "Label": label, 
            "Num of Pixels": acre_counter[label], 
            "Area": acre_counter[label] * 900, 
            "Acres": round(acre_counter[label] * 900 / 4046.86, 3)
        })


    save_Table_images(pics_path=pics_path, table=table, name='high_low_rulebased')

    print('wo clust')
    x = np.reshape(x, shape_to_reshape)

    if include_outlier_pixels:
        print(len(outlier_vals_for_2class_clust))
        x[nan_posn] = outlier_vals_for_2class_clust

    plt.figure(figsize = (10, 10))
    plt.axis('off')
    # plt.title('wo clustering')
    plt.imshow(x,cmap = cool_map2)
    # cbar  =  plt.colorbar()
    # cbar.set_ticks(np.arange(1, 3, dtype = int))
    # cbar.set_ticklabels(np.arange(1, 3, dtype = int))
    plt.grid(False)
    # plt.show()

    output_path = f'{pics_path}/high_low_rulebased.tif'  # Specify the output file name
    # plt.savefig(output_path, format='tiff', bbox_inches='tight', pad_inches=0)
    tifffile.imwrite(output_path, x.astype('float32'))  
    plt.close()


    #❌❌❌ Intermediate map generated based on avg of all 5 years...

    new_val = []
    print(f"threshold-> {total_mean}")

    #❌❌❌ Rule based for each pixel, finding intermed vals, (threshld val shud be the avg of all 5 years {not clust thresh})
    for i in range(data.shape[0]):
        bl = 0            #5-bl  =  ab
        for j in data[i]:
            if j < total_mean : bl += 1
        new_val.append(5 - bl + 1)

    count_val = {i : new_val.count(i) + outlier_vals_for_6class_clust.count(i) for i in [1, 2, 3, 4, 5, 6]}   # adding pixels and outlier pixels too
    print(sum(count_val.values()))

    table = []
    for i in [1, 2, 3, 4, 5, 6]:
        print(f"{i}-Pixel count - {count_val[i]}, Area - {count_val[i]*900}, Acres - {round(count_val[i]*900/4046.86, 3)}")
        table.append({
            "Label": i, 
            "Num of Pixels": count_val[i], 
            "Area": count_val[i] * 900, 
            "Acres": round(count_val[i] * 900 / 4046.86, 3)
        })

    save_Table_images(pics_path=pics_path, table=table, name='intermediate_rule_based')

    x = np.ones(shape = shape_to_reshape)
    x[nan_posn] = 0

    x = make_the_map(x=x, mapper=new_val)

    confusion_matrix_store.append((x, 'woclust'))
    
    print('wo clust')
    # print(set(new_val))
    x = np.reshape(x, shape_to_reshape)

    if include_outlier_pixels:
        x[nan_posn] = outlier_vals_for_6class_clust  # including outlier pixels to the map


    plt.figure(figsize = (10, 10))
    plt.axis('off')
    # plt.title('Intermediate map (wo clust)')
    plt.imshow(x,cmap = cool_map3)
    plt.grid(False)
    # plt.colorbar(label = 'Color Legend')
    # plt.show()
    output_path = f'{pics_path}/intermediate_rule_based.tif'  # Specify the output file name
    # plt.savefig(output_path, format='tiff', bbox_inches='tight', pad_inches=0)
    tifffile.imwrite(output_path, x.astype('float32'))  
    plt.close()

    return confusion_matrix_store


def LinePLot_X_Intermediate_map(stat_clust_vals, inter_clust_val1, threshold, variance_plot, mapper_4_plotting, confusion_matrix_store, labels, shape_to_reshape,  stat_analyz, nan_posn, vals_in_None, pics_path, include_outlier_pixels : bool = False): 
    """ plots lineplot by taking each mean value of a cluster for each year and then plots the intermediate map (clustered version)"""

    selected_stat_analyz = stat_analyz_type[stat_analyz]

    # 🌟🌟🌟 Line plot
    labels_plots = ['2019', '2020', '2021', '2022', '2023']
    data = []

    for i in labels_plots:
        y_val = [stat_clust_vals[lab][i][selected_stat_analyz] for lab in stat_clust_vals]
        for lab, val in zip(stat_clust_vals.keys(), y_val):
            data.append({'Cluster': lab, 'Value': val, 'Year': i})

    data = pd.DataFrame(data)
    
    plt.figure(figsize=(35, 10))

    # Loop through the unique years and plot them individually
    for year in data['Year'].unique():
        subset = data[data['Year'] == year]
        plt.plot(subset['Cluster'], subset['Value'], marker='o', markersize=10, label=f'{year}')

    # Set labels
    plt.xlabel('Clusters')
    plt.ylabel('Mean')

    # Create and customize the legend
    legend = plt.legend(title='Year', prop={'size': 30})  # Adjust the size as needed
    legend.get_frame().set_facecolor('white')
    for text in legend.get_texts():
        text.set_color("black")

    # Optionally, add a horizontal line if condition is met
    if not stat_analyz:
        plt.axhline(y=threshold, color='black', linestyle='--')

    # plt.show()
    output_path = f'{pics_path}/line_plot.tif'  # Specify the output file name
    plt.savefig(output_path, format='tiff', bbox_inches='tight', pad_inches=0)

    plt.close()



    # INTERMEDIATE MAPS 👇  (Avg value from clustering , wo clust is done in high_low_using_clustering())

    print(f"threshold -> {threshold}")  

    #❌❌❌ converting old labels to new and then getting that label's intermed value... 

    new_labels = [inter_clust_val1[mapper_4_plotting[i]] for i in labels]    # takes the intermed values of new labels

    # temp = 0
    # for i in labels:   #ig for clusters affter 60
    #     if mapper_4_plotting[i] >= 60:
    #         temp += 1
    # print(temp)


    new_labels_count = {i : new_labels.count(i) + vals_in_None.count(i) for i in [1, 2, 3, 4, 5, 6]}   # included outliers too


    for i in range(1, 7):
        if i not in new_labels_count:
            new_labels_count[i] = 0

    # Complete pixel count
    print(f"pixel count -> {sum(new_labels_count.values())} ")

    table = []
    for i in [1, 2, 3, 4, 5, 6]:  #Area, Acre Counter
        print(f"{i}- num of pixels {new_labels_count[i]}, Area - {new_labels_count[i]*900}, Acres - {round(new_labels_count[i]*900/4046.86, 3)}")
        table.append({
            "Label": i, 
            "Num of Pixels": new_labels_count[i], 
            "Area": new_labels_count[i] * 900, 
            "Acres": round(new_labels_count[i] * 900 / 4046.86, 3)
        })
    

    save_Table_images(pics_path=pics_path, name='intermediate_clustering', table=table)

    x = np.ones(shape = shape_to_reshape)
    x[nan_posn] = 0


    x = make_the_map(x=x, mapper=new_labels)

    # x = x.flatten()
    # c = 0
    # for j in range(len(x)):
    #     if x[j]:
    #         x[j] = new_labels[c]
    #         c += 1
    #     else:
    #         x[j] = np.nan
        

    confusion_matrix_store.append((x, 'wclust')) 

    print('w clust')
    x = np.reshape(x, shape_to_reshape)
    
    if include_outlier_pixels:
        x[nan_posn] = vals_in_None


    plt.figure(figsize = (10, 10))
    # plt.title('Intermediate map (w clust)')
    plt.axis('off')
    
    bounds = [1, 2, 3, 4, 5, 6, 7]  # 6 labels + 1 for upper boundary
    norm = BoundaryNorm(bounds, len(coolors3), extend='neither')

    plt.imshow(x,cmap = cool_map3, norm=norm)
    plt.grid(False)
    # plt.colorbar(label = 'Color Legend')
    # plt.show()
    output_path = f'{pics_path}/intermediate_clustering.tif'  # Specify the output file name
    # plt.savefig(output_path, format='tiff', bbox_inches='tight', pad_inches=0)
    tifffile.imwrite(output_path, x.astype('float32'))
    plt.close()

    return confusion_matrix_store, data





def interested_cluster_plot(mapper, labels, shape_to_reshape, nan_posn, interested_cluster, pics_path, title='interested_cluster_map'):
    """ 
     plots the pixel map, with the interested cluster value
    """
    temp = np.ones(shape=shape_to_reshape)
    temp[nan_posn] = 0
    temp = temp.flatten()
    c = 0
    pix_counter = 0

    for i in range(len(temp)):
        if temp[i]:
            if mapper[labels[c]] == interested_cluster:
                pix_counter += 1
                temp[i] = 2
            else:temp[i] = 1
            c += 1
        else:
            temp[i] = np.nan

    print(f"{interested_cluster} - num of pixels {pix_counter}, Area - {pix_counter * 900}, Acres - {round(pix_counter * 900 / 4046.86, 3)}")

    temp=np.reshape(temp, shape_to_reshape)
    plt.figure(figsize=(5,5))
    plt.imshow(temp,cmap=cool_map2)

    cbar = plt.colorbar()
    cbar.set_ticks(np.arange(1, 3, dtype=int))
    cbar.set_ticklabels(np.arange(1, 3, dtype=int))
    plt.title(f'2 -> Cluster {interested_cluster}')
    plt.grid(False)

    output_path = f'{pics_path}/interested_pixel_{title}.tif'  # Specify the output file name
    # plt.savefig(output_path, format='tiff', bbox_inches='tight', pad_inches=0)
    tifffile.imwrite(output_path, temp.astype('float32'))  
    plt.close()



def pix_count(pixel_count_plot, mapper, pics_path):
        rev_mapper = {j : i for i, j in mapper.items()}
        x = {i:pixel_count_plot[rev_mapper[i]] for i in pixel_count_plot.keys()}

        print(f"Pixel Count -> {x}")
        
        plt.figure(figsize = (35,10))
        plt.plot(x.keys(), x.values(), label='pixel')
        plt.scatter(x.keys(), x.values())
        plt.legend()

        legend = plt.legend()
        legend.get_frame().set_facecolor('black')  # Setting legend background color
        legend.get_texts()[0].set_color("white")
        plt.xlabel('clusters')
        plt.ylabel('pixel count')
        plt.tight_layout()
        plt.grid(True)


        output_path = f'{pics_path}/pixel_count_plot.tif'  # Specify the output file name
        plt.savefig(output_path, format='tiff', bbox_inches='tight', pad_inches=0)

        plt.close()


def confusion_matrix(confusion_matrix_store):
    ConfusionMatrix = [{j : 0 for j in range(6)} for _ in range(6)]
    for i in range(len(confusion_matrix_store[0][0])):
        if np.isnan(confusion_matrix_store[0][0][i]):
            continue
        rb = int(confusion_matrix_store[0][0][i])   #rule based -> rows (actual)
        clt = int(confusion_matrix_store[1][0][i])  #clustering -> cols (pred)
        ConfusionMatrix[rb - 1][clt - 1] += 1
    return np.transpose([[j[i] for i in j] for j in ConfusionMatrix])   #rule based (actual) - cols, clust (pred) - rows