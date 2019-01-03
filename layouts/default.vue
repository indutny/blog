<template>
  <div>
    <m-navbar/>
    <b-container>
      <b-row>
        <b-col><nuxt/></b-col>
      </b-row>
      <b-row>
        <b-col class="text-right">
          <small>
            <i>
              Copyright Fedor Indutny {{ new Date().getFullYear() }};
              Released under
              <a href="https://opensource.org/licenses/mit-license.php">
                MIT license
              </a>
            </i>
          </small>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import mNavbar from '~/components/navbar';

export default {
  components: { mNavbar }
};
</script>
