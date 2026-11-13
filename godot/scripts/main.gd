extends Node3D

const RUNNER_SCRIPT = preload("res://scripts/runner.gd")
const LANE_WIDTH := 2.6
const SPAWN_DISTANCE := 58.0
const DESPAWN_DISTANCE := 9.0

var runner: CharacterBody3D
var camera: Camera3D
var world_root: Node3D
var spawn_timer := 0.0
var spawn_interval := 1.25
var speed := 18.0
var elapsed := 0.0
var score := 0
var coins := 0
var best_score := 0
var game_state := "ready"
var shield_active := false
var magnet_time := 0.0
var hud: CanvasLayer
var score_label: Label
var coin_label: Label
var message_label: Label
var start_button: Button
var pause_button: Button
var touch_left: Button
var touch_right: Button
var touch_jump: Button
var touch_slide: Button
var entities: Array[Node3D] = []
var rng := RandomNumberGenerator.new()
var swipe_origin := Vector2.ZERO

func _ready() -> void:
	rng.randomize()
	best_score = int(ConfigFile.new().get_value("records", "best", 0))
	_build_world()
	_build_runner()
	_build_camera()
	_build_hud()
	_set_state("ready")

func _build_world() -> void:
	var environment := WorldEnvironment.new()
	var env := Environment.new()
	env.background_mode = Environment.BG_SKY
	env.sky = Sky.new()
	env.sky.sky_material = ProceduralSkyMaterial.new()
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.48, 0.58, 0.66)
	env.ambient_light_energy = 0.65
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	environment.environment = env
	add_child(environment)

	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-48, -28, 0)
	sun.light_energy = 1.4
	sun.shadow_enabled = true
	add_child(sun)

	world_root = Node3D.new()
	world_root.name = "World"
	add_child(world_root)
	_make_box(world_root, Vector3(0, -0.25, -65), Vector3(9.2, 0.5, 150), Color(0.12, 0.16, 0.18))
	for lane_mark in [-1.3, 1.3]:
		for i in range(30):
			_make_box(world_root, Vector3(lane_mark, 0.012, -i * 5.0), Vector3(0.045, 0.02, 2.3), Color(0.76, 0.72, 0.58))
	for side in [-1, 1]:
		_make_box(world_root, Vector3(side * 5.0, 0.3, -65), Vector3(0.5, 0.6, 150), Color(0.25, 0.29, 0.3))
		for i in range(13):
			var z := -i * 11.0 - 5.0
			var h := rng.randf_range(5.0, 13.0)
			var w := rng.randf_range(3.0, 5.5)
			var building := _make_box(world_root, Vector3(side * rng.randf_range(8.0, 11.0), h * 0.5, z), Vector3(w, h, 7.0), Color(0.19, 0.29, 0.34))
			building.material_override = _material(Color(0.19 + rng.randf() * 0.08, 0.28 + rng.randf() * 0.08, 0.33 + rng.randf() * 0.08))
			for row in range(2, int(h / 2.2)):
				for col in range(2):
					var window := _make_box(world_root, Vector3(building.position.x - side * 0.8 + col * side * 1.3, row * 2.0, z + 3.56), Vector3(0.75, 0.9, 0.08), Color(0.83, 0.68, 0.39))
					window.material_override = _material(Color(0.83, 0.68, 0.39), 0.4)

func _build_runner() -> void:
	runner = RUNNER_SCRIPT.new()
	runner.name = "Runner"
	runner.lane_width = LANE_WIDTH
	runner.hit.connect(_on_runner_hit)
	add_child(runner)

func _build_camera() -> void:
	camera = Camera3D.new()
	camera.position = Vector3(0, 5.3, 10.5)
	camera.rotation_degrees = Vector3(-17, 0, 0)
	camera.fov = 68
	add_child(camera)
	camera.current = true

func _build_hud() -> void:
	hud = CanvasLayer.new()
	add_child(hud)
	var panel := PanelContainer.new()
	panel.set_anchors_preset(Control.PRESET_TOP_WIDE)
	panel.offset_left = 22
	panel.offset_top = 18
	panel.offset_right = -22
	panel.offset_bottom = 82
	var row := HBoxContainer.new()
	panel.add_child(row)
	score_label = Label.new()
	score_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	score_label.add_theme_font_size_override("font_size", 25)
	row.add_child(score_label)
	coin_label = Label.new()
	coin_label.add_theme_font_size_override("font_size", 22)
	row.add_child(coin_label)
	hud.add_child(panel)

	message_label = Label.new()
	message_label.set_anchors_preset(Control.PRESET_CENTER)
	message_label.position = Vector2(-250, -110)
	message_label.size = Vector2(500, 110)
	message_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	message_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	message_label.add_theme_font_size_override("font_size", 28)
	hud.add_child(message_label)

	start_button = Button.new()
	start_button.text = "JUGAR"
	start_button.set_anchors_preset(Control.PRESET_CENTER)
	start_button.position = Vector2(-90, 10)
	start_button.size = Vector2(180, 54)
	start_button.pressed.connect(_start_game)
	hud.add_child(start_button)

	pause_button = Button.new()
	pause_button.text = "Ⅱ"
	pause_button.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	pause_button.position = Vector2(-74, 95)
	pause_button.size = Vector2(52, 48)
	pause_button.pressed.connect(_toggle_pause)
	hud.add_child(pause_button)

	var controls := HBoxContainer.new()
	controls.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	controls.alignment = BoxContainer.ALIGNMENT_CENTER
	controls.offset_top = -74
	controls.offset_bottom = -15
	controls.add_theme_constant_override("separation", 14)
	hud.add_child(controls)
	touch_left = _add_control_button(controls, "◀", _move_left)
	touch_right = _add_control_button(controls, "▶", _move_right)
	touch_jump = _add_control_button(controls, "SALTAR", _jump)
	touch_slide = _add_control_button(controls, "DESLIZAR", _slide)

func _add_control_button(parent: Control, label: String, callback: Callable) -> Button:
	var button := Button.new()
	button.text = label
	button.custom_minimum_size = Vector2(78, 48)
	button.pressed.connect(callback)
	parent.add_child(button)
	return button

func _make_box(parent: Node3D, pos: Vector3, size: Vector3, color: Color) -> MeshInstance3D:
	var mesh := BoxMesh.new()
	mesh.size = size
	var instance := MeshInstance3D.new()
	instance.mesh = mesh
	instance.position = pos
	instance.material_override = _material(color)
	parent.add_child(instance)
	return instance

func _material(color: Color, emission := 0.0) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.albedo_color = color
	mat.roughness = 0.82
	if emission > 0.0:
		mat.emission_enabled = true
		mat.emission = color
		mat.emission_energy_multiplier = emission
	return mat

func _start_game() -> void:
	for entity in entities:
		if is_instance_valid(entity):
			entity.queue_free()
	entities.clear()
	runner.reset_runner()
	speed = 18.0
	spawn_interval = 1.25
	spawn_timer = 0.25
	elapsed = 0.0
	score = 0
	coins = 0
	shield_active = false
	magnet_time = 0.0
	_set_state("playing")

func _set_state(next_state: String) -> void:
	game_state = next_state
	var active := next_state == "playing"
	start_button.visible = not active
	pause_button.visible = active or next_state == "paused"
	touch_left.visible = active
	touch_right.visible = active
	touch_jump.visible = active
	touch_slide.visible = active
	match next_state:
		"ready":
			message_label.text = "MY RUNNER 3D\nCorre, esquiva y sobrevive"
			start_button.text = "JUGAR"
		"playing":
			message_label.text = ""
		"paused":
			message_label.text = "PAUSA"
			start_button.visible = true
			start_button.text = "CONTINUAR"
		"game_over":
			message_label.text = "¡FIN DE LA CARRERA!\nPuntuación: %d   •   Récord: %d" % [score, best_score]
			start_button.visible = true
			start_button.text = "VOLVER A JUGAR"

func _toggle_pause() -> void:
	if game_state == "playing":
		_set_state("paused")
	elif game_state == "paused":
		_set_state("playing")

func _process(delta: float) -> void:
	if game_state != "playing":
		return
	elapsed += delta
	speed = minf(18.0 + elapsed * 0.24, 34.0)
	spawn_interval = maxf(0.62, 1.25 - elapsed * 0.004)
	spawn_timer -= delta
	if spawn_timer <= 0.0:
		_spawn_pattern()
		spawn_timer = spawn_interval
	score += int(speed * delta * 2.0)
	if magnet_time > 0.0:
		magnet_time -= delta
	for entity in entities.duplicate():
		if not is_instance_valid(entity):
			entities.erase(entity)
			continue
		entity.position.z += speed * delta
		if entity.position.z > DESPAWN_DISTANCE:
			entities.erase(entity)
			entity.queue_free()
	_update_hud()

func _physics_process(_delta: float) -> void:
	if game_state == "playing":
		runner.set_game_active(true)
	else:
		runner.set_game_active(false)

func _spawn_pattern() -> void:
	var pattern := rng.randi_range(0, 5)
	var lane := rng.randi_range(0, 2)
	match pattern:
		0:
			_spawn_hazard(lane, "barrier")
			_spawn_coin_line((lane + 1) % 3)
		1:
			_spawn_hazard(lane, "arch")
			_spawn_coin_line(lane)
		2:
			_spawn_hazard(lane, "train")
		3:
			_spawn_coin_line(lane)
			_spawn_coin_line((lane + 1) % 3)
		4:
			_spawn_hazard(lane, "barrier")
			_spawn_hazard((lane + 1) % 3, "arch")
		5:
			_spawn_powerup(lane, "magnet" if rng.randf() < 0.5 else "shield")

func _spawn_hazard(lane: int, kind: String) -> void:
	var body := StaticBody3D.new()
	body.name = "Hazard_" + kind
	body.add_to_group("hazard")
	body.position = Vector3((lane - 1) * LANE_WIDTH, 0, -SPAWN_DISTANCE)
	var size := Vector3(1.7, 1.3, 1.0)
	var y := 0.65
	var color := Color(0.9, 0.42, 0.12)
	if kind == "arch":
		size = Vector3(1.8, 1.25, 1.0)
		y = 1.65
		color = Color(0.92, 0.7, 0.18)
	elif kind == "train":
		size = Vector3(2.15, 3.6, 7.0)
		y = 1.8
		color = Color(0.12, 0.37, 0.55)
	var mesh := BoxMesh.new()
	mesh.size = size
	var visual := MeshInstance3D.new()
	visual.mesh = mesh
	visual.position.y = y
	visual.material_override = _material(color)
	body.add_child(visual)
	var shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = size
	shape.shape = box
	shape.position.y = y
	body.add_child(shape)
	world_root.add_child(body)
	entities.append(body)

func _spawn_coin_line(lane: int) -> void:
	for i in range(5):
		var coin := Area3D.new()
		coin.name = "Coin"
		coin.position = Vector3((lane - 1) * LANE_WIDTH, 1.15 + sin(i * 0.7) * 0.18, -SPAWN_DISTANCE - i * 2.0)
		var visual := MeshInstance3D.new()
		var mesh := CylinderMesh.new()
		mesh.top_radius = 0.38
		mesh.bottom_radius = 0.38
		mesh.height = 0.12
		visual.mesh = mesh
		visual.rotation_degrees.x = 90
		visual.material_override = _material(Color(1.0, 0.72, 0.12), 1.1)
		coin.add_child(visual)
		var collision := CollisionShape3D.new()
		var sphere := SphereShape3D.new()
		sphere.radius = 0.72
		collision.shape = sphere
		coin.add_child(collision)
		coin.body_entered.connect(_on_pickup.bind("coin", coin))
		world_root.add_child(coin)
		entities.append(coin)

func _spawn_powerup(lane: int, kind: String) -> void:
	var power := Area3D.new()
	power.name = "Powerup_" + kind
	power.position = Vector3((lane - 1) * LANE_WIDTH, 1.35, -SPAWN_DISTANCE)
	var visual := MeshInstance3D.new()
	var mesh := SphereMesh.new()
	mesh.radius = 0.55
	mesh.height = 1.1
	visual.mesh = mesh
	visual.material_override = _material(Color(0.15, 0.9, 0.78) if kind == "shield" else Color(0.35, 0.68, 1.0), 1.3)
	power.add_child(visual)
	var collision := CollisionShape3D.new()
	var sphere := SphereShape3D.new()
	sphere.radius = 0.85
	collision.shape = sphere
	power.add_child(collision)
	power.body_entered.connect(_on_pickup.bind(kind, power))
	world_root.add_child(power)
	entities.append(power)

func _on_pickup(body: Node3D, kind: String, pickup: Node3D) -> void:
	if body != runner or not is_instance_valid(pickup):
		return
	if kind == "coin":
		coins += 1
		score += 50
	elif kind == "shield":
		shield_active = true
	elif kind == "magnet":
		magnet_time = 8.0
	entities.erase(pickup)
	pickup.queue_free()
	_update_hud()

func _on_runner_hit() -> void:
	if game_state != "playing":
		return
	if shield_active:
		shield_active = false
		runner.flash_invulnerable()
		return
	best_score = maxi(best_score, score)
	var config := ConfigFile.new()
	config.set_value("records", "best", best_score)
	config.save("user://records.cfg")
	_set_state("game_over")

func _update_hud() -> void:
	score_label.text = "PUNTOS  %07d     " % score
	coin_label.text = "🟡 %d   " % coins + ("ESCUDO" if shield_active else ("IMÁN" if magnet_time > 0.0 else ""))

func _move_left() -> void:
	if game_state == "playing": runner.change_lane(-1)

func _move_right() -> void:
	if game_state == "playing": runner.change_lane(1)

func _jump() -> void:
	if game_state == "playing": runner.jump()

func _slide() -> void:
	if game_state == "playing": runner.slide()

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		match event.keycode:
			KEY_LEFT, KEY_A: _move_left()
			KEY_RIGHT, KEY_D: _move_right()
			KEY_UP, KEY_W, KEY_SPACE: _jump()
			KEY_DOWN, KEY_S: _slide()
			KEY_ESCAPE: _toggle_pause()
	if event is InputEventScreenTouch:
		if event.pressed:
			swipe_origin = event.position
		else:
			var delta := event.position - swipe_origin
			if delta.length() > 42:
				if absf(delta.x) > absf(delta.y):
					_move_left() if delta.x < 0 else _move_right()
				else:
					_jump() if delta.y < 0 else _slide()

func _notification(what: int) -> void:
	if what == NOTIFICATION_WM_CLOSE_REQUEST:
		get_tree().quit()
