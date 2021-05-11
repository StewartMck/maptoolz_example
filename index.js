$(() => {
  let points = [];
  let markers = [];
  let drawings = [];
  let map;
  let count = 1;

  const populateTable = ({ lat, lng, id }) => {
    const DEC = MapToolz.toDEC([lat, lng]);
    const DMS = MapToolz.toDMS([lat, lng]);
    const DDM = MapToolz.toDDM([lat, lng]);
    $(".points").append(
      `         <tr id="${id}">
            <th>${id}</th>
            <th>${DEC[0].lat}, ${DEC[0].long}</th>
            <th>${DMS[0].lat}, ${DMS[0].long}</th>
            <th>${DDM[0].lat}, ${DDM[0].long}</th>
          </tr>
`
    );
  };

  const createMarker = (point, title) => {
    const marker = L.marker(point)
      .bindTooltip(title, {
        permanent: true,
        direction: "right",
      })
      .addTo(map);
    return marker;
  };

  const mapClickHandler = (e) => {
    const point = new L.LatLng(e.latlng.lat, e.latlng.lng);
    point.id = count;

    const marker = createMarker(point, `P${count}`);
    markers.push(marker);
    points.push(point.lat, point.lng);
    count += 1;
    populateTable(point);

    //click event for deleting marker on map
    marker.on("click", (e) => {
      map.removeLayer(marker);
      $(".points").find(`#${point.id}`).remove();
      points = points.filter((e) => e !== point.lat && e !== point.lng);
    });
  };

  const getUserPosition = () => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  };

  const createMap = (pos, zoom) => {
    const mapOptions = {
      center: pos,
      zoom: zoom,
    };
    map = new L.map("map", mapOptions);
    // Creating a Layer object
    const layer = new L.TileLayer(
      "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    );
    // Adding layer to the map
    map.addLayer(layer);
    map.on("click", mapClickHandler);
  };

  getUserPosition()
    .then(({ coords }) => {
      createMap(new L.LatLng(coords.latitude, coords.longitude), 10);
    })
    .catch(() => {
      createMap(new L.LatLng(0, 0), 5);
    });

  const measureDistance = () => {
    try {
      const format = $("#format_select").val();
      const distance = MapToolz.getDistance(MapToolz.toDEC(points), format);
      const drawPoints = [];
      MapToolz.toDEC(points).map((point) => {
        drawPoints.push([point.lat, point.long]);
      });
      drawings.push(L.polyline(drawPoints, { color: "red" }).addTo(map));
      $("#distance_output").val(`${distance.distance} ${distance.format}`);
    } catch (e) {
      $(".error").find("h3").text(e.message);
      setTimeout(() => {
        $(".error").find("h3").text("");
      }, 5000);
    }
  };

  const getCenter = () => {
    try {
      const center = MapToolz.getCenterPoint(MapToolz.toDEC(points));
      const point = new L.LatLng(center.lat, center.long);
      //create marker on map
      const marker = createMarker(point, "Center");
      markers.push(marker);
      $("#center_output").val(`${center.lat}, ${center.long}`);
    } catch (e) {
      $(".error").find("h3").text(e.message);
      setTimeout(() => {
        $(".error").find("h3").text("");
      }, 5000);
    }
  };

  const random = (value) => {
    const min = value;
    const max = value + 1;
    return Math.random() * (max - min + 1) + min;
  };

  const sortPoints = () => {
    const bounds = [];
    try {
      const { lat, long } = MapToolz.toDEC(points)[0];
      bounds.push([lat, long]);
      points.length = 0;
      for (let i = 0; i < 5; i++) {
        const randomLat = random(Number(lat));
        const randomLong = random(Number(long));
        points.push(randomLat, randomLong);
        bounds.push([randomLat, randomLong]);
        const point = new L.LatLng(randomLat, randomLong);
        point.id = count;
        const marker = createMarker(point, `P${count}`);
        markers.push(marker);
        count += 1;
      }

      map.fitBounds(bounds);
      const sorted = MapToolz.orderByDistance(
        { lat, long },
        MapToolz.toDEC(points)
      );
      sorted.map((point) => {
        const { lat: fromLat, long: fromLong } = point.from;
        const { lat: toLat, long: toLong } = point.to;
        const { distance, format } = point;
        const toID = markers.filter((point) => {
          return point._latlng.lat.toFixed(5) === toLat;
        })[0]._latlng.id;
        $(".sorted").append(
          `         <tr id="">
                  <th>P${markers[0]._latlng.id} - P${toID}</th>
                  <th>${fromLat}, ${fromLong}</th>
                  <th>${toLat}, ${toLong}</th>
                  <th>${distance} ${format}</th>
                </tr>
      `
        );
      });
    } catch (e) {
      $(".error").find("h3").text(e.message);
      setTimeout(() => {
        $(".error").find("h3").text("");
      }, 5000);
    }
  };

  $("#distance").on("click", measureDistance);

  $("#getCenter").on("click", getCenter);

  $("#clearPoints").on("click", () => {
    points.length = 0;
    markers.map((marker) => map.removeLayer(marker));
    drawings.map((drawing) => map.removeLayer(drawing));
    $(".points").find("tr:gt(0)").remove();
    $(".sorted").find("tr:gt(0)").remove();
    $(".error").find("h3").text("");
    $("#center_output").val("");
    $("#distance_output").val("");
    count = 1;
  });

  $("#sortPoints").on("click", sortPoints);
});
