import json


def osm_to_geojson(input_file, output_file):
    with open(input_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Step 1: 构建 node id -> (lon, lat) 映射
    node_dict = {}
    for elem in data.get("elements", []):
        if elem["type"] == "node":
            node_dict[elem["id"]] = (elem["lon"], elem["lat"])

    # Step 2: 收集符合条件的高速路段
    features = []
    for elem in data.get("elements", []):
        if elem["type"] != "way":
            continue

        tags = elem.get("tags", {})
        highway = tags.get("highway")
        if highway not in ("motorway", "trunk"):
            continue

        # 获取节点坐标
        coords = []
        for nid in elem.get("nodes", []):
            if nid in node_dict:
                coords.append(node_dict[nid])
            else:
                print(f"Warning: Node {nid} not found.")

        if len(coords) < 2:
            continue

        feature = {
            "type": "Feature",
            "properties": {
                "name": tags.get("name", ""),
                "ref": tags.get("ref", ""),
                "highway": highway,
            },
            "geometry": {"type": "LineString", "coordinates": coords},
        }
        features.append(feature)

    # Step 3: 写入 GeoJSON
    geojson = {"type": "FeatureCollection", "features": features}

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(geojson, f, ensure_ascii=False, indent=2)

    print(f"✅ 转换完成！共提取 {len(features)} 条高速路段。")
    print(f"输出文件: {output_file}")


if __name__ == "__main__": 
    osm_to_geojson("putian_high_way.json", "highway.geojson")
