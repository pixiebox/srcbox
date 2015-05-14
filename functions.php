<?php
/*

	If you want to use it i WordPress, copy + paste 
	this is for your WordPress Theme functions.php

*/

function srcbox_add_image_sizes () {

	add_image_size( 'mobile', 480 );
	add_image_size( 'retina@2', 640 );
	add_image_size( 'tablet', 900 );
	add_image_size( 'desktop', 1170 );
	add_image_size( 'retina@3', 2048 );

}

add_action( 'init', 'srcbox_add_image_sizes' );

function srcbox_add_admin_menu (  ) { 

	add_options_page( 'srcBox', 'srcBox', 'manage_options', 'srcBox', 'srcbox_options_page' );

}

function srcbox_settings_init (  ) { 

	register_setting( 'srcPage', 'srcbox_settings' );

	add_settings_section(
		'srcbox_srcPage_section', 
		__( 'srcBox breakpoints', 'wordpress' ), 
		'srcbox_settings_section_callback',
		'srcPage'
	);

	add_settings_field (  
		'srcbox_checkbox_field_0',  
		__( 'Breakpoints', 'wordpress' ),
		'srcbox_checkbox_field_0_render', 
		'srcPage', 
		'srcbox_srcPage_section'
	);

}

function srcbox_checkbox_field_0_render (  ) { 

	$options = get_option( 'srcbox_settings' );
	if ( !$options ) $options = array();
	
	$html = '';
	$_breakpoints = array(
		array(
			'breakpoint_id' => 'breakpoint_480',
			'name'			=> 'breakpoint mobile'
		),
		array(
			'breakpoint_id' => 'breakpoint_640',
			'name'			=> 'breakpoint mobile retina @2'
		),
		array(
			'breakpoint_id' => 'breakpoint_900',
			'name'			=> 'breakpoint tablet'
		),
		array(
			'breakpoint_id' => 'breakpoint_1170',
			'name'			=> 'breakpoint desktop'
		),
		array(
			'breakpoint_id' => 'breakpoint_2048',
			'name'			=> 'breakpoint tablet retina @2 / mobile retina @3'
		),
	);

	foreach ($_breakpoints as $breakpoint) {

		$checked = in_array($breakpoint['breakpoint_id'], $options) ? 'checked="checked"' : '';
		$disabled = !empty($checked) && $breakpoint['breakpoint_id'] !== 'breakpoint_2048' ? 'disabled' : '';
		
		$html .= sprintf( '<input type="checkbox" id="%1$s[%2$s]" name="%1$s[]" value="%2$s" %3$s %4$s />', 'srcbox_settings', $breakpoint['breakpoint_id'], $checked, $disabled );
		$html .= sprintf( '<label for="%1$s[%3$s]"> %2$s</label><br>', 'srcbox_settings', $breakpoint['name'], $breakpoint['breakpoint_id'] );

	}
	
	echo $html;

}

function srcbox_settings_section_callback(  ) { 

	echo __( 'Bij voorkeur alle checkboxes aanvinken, voor elk apparaat wordt dan een aparte afbeelding ingeladen.', 'wordpress' );

}


function srcbox_options_page(  ) { 

	?>
	<form action='options.php' method='post'>
		
		<h2>srcBox</h2>
		
	<?php
		settings_fields( 'srcPage' );
		do_settings_sections( 'srcPage' );
		submit_button();
	?>
		
	</form>
	<?php

}
	
add_action( 'admin_menu', 'srcbox_add_admin_menu' );
add_action( 'admin_init', 'srcbox_settings_init' );

function srcbox_handle_upload_prefilter ( $file ) {

	$options = get_option( 'srcbox_settings' );
	$minimum_width = (int) str_replace('breakpoint_', '', end($options));

    $img = getimagesize($file['tmp_name']);
    $width = $img[0];
 
    if ( $width < $minimum_width ) {

		$e_settings  = __('Settings');

		return array(
			"error" => "Image dimensions are too small.
						Minimum width is {$minimum_width}px.
						Uploaded image width is {$width} px.
						Remove the largest breakpoints, like 2048 and perhaps 1170,
						from \"{$e_settings} &gt;srcBox\" to prevent this message."
		);

	} else {

		return $file; 

	}

}

add_filter( 'wp_handle_upload_prefilter', 'srcbox_handle_upload_prefilter' );

function srcbox_rename_intermediates ( $image ) {
    // Split the $image path into directory/extension/name
    $info = pathinfo( $image );
    $dir = $info['dirname'] . '/';
    $ext = '.' . $info['extension'];
    $name = wp_basename( $image, "$ext" );

    // Build our new image name
    $name_prefix = substr( $name, 0, strrpos( $name, '-' ) );
    $size_extension = substr( $name, strrpos( $name, '-' ) + 1, 3 );
    $new_name = $dir . $name_prefix . '-' . $size_extension . $ext;

    // Rename the intermediate size
    $did_it = rename( $image, $new_name );

    // Renaming successful, return new name
    if( $did_it ) return $new_name;

    return $image;

}

// The filter runs when resizing an image to make a thumbnail or intermediate size.
add_filter( 'image_make_intermediate_size', 'srcbox_rename_intermediates' );

function srcbox_post_thumbnail_html ( $html ) {

	if ( empty($html) ) return $html;

	preg_match(
		'/< *img[^>]*src *="[^"]*(uploads\/)(.+\\/.+\\-[0-9]+(.jpg|.jpeg|.png|.gif))/i',
		preg_replace(
			'/(https?:\\/\\/)(.+\\/)(wp-content\/)(.+\\/)(.+\\-)([0-9]+)(.jpg|.jpeg|.png|.gif)/',
			'$4${5}640$7',
			$html
		),
		$is_src_boxed
	);

	$upload_dir = wp_upload_dir();   

	if ( file_exists( $upload_dir['basedir'] . '/' . $is_src_boxed[2] ) ) {

		$html = preg_replace(
			'/src="(https?:\\/\\/.+\\/)(.+\\-)([0-9]+)(.jpg|.jpeg|.png|.gif)"/',
			'src="" data-breakpoint="$1" data-img="$2{folder}$4"',
			preg_replace(
				'/( width| height)=["\']\d*["\']\s?/',
				'',
				preg_replace(
					'/<img ?([^>]*)class="([^"]*)"?/',
					'<img $1 class="$2 srcbox thumbnail"',
					$html
				)
			)
		);

		return $html;

	}

	return $html;

}

add_filter( 'post_thumbnail_html', 'srcbox_post_thumbnail_html', 99, 1 );
add_filter( 'the_content', 'srcbox_post_thumbnail_html', 10 );
add_filter( 'get_avatar', 'srcbox_post_thumbnail_html', 10 );